import os
import requests
from .serializers import ConversationSerializer, MessageSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Conversation, Message
from gtts import gTTS
import whisper
import tempfile


TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # 🔐 Appelle la clé depuis l'environnement
model_whisper = whisper.load_model("base")

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def chat_with_ai(request):
    user = request.user
    prompt = request.data.get("prompt")
    conversation_id = request.data.get("conversation_id")

    if not prompt:
        return Response({"error": "Le message est vide"}, status=status.HTTP_400_BAD_REQUEST)

    # Récupère ou crée la conversation
    if conversation_id:
        try:
            conversation = Conversation.objects.get(id=conversation_id, user=user)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation non trouvée"}, status=status.HTTP_404_NOT_FOUND)
    else:
        conversation = Conversation.objects.create(
            user=user,
            title=prompt[:40]  # Titre par défaut basé sur le début du message
        )

    # Sauvegarde le message utilisateur
    Message.objects.create(
        conversation=conversation,
        sender="user",
        content=prompt
    )

    # Prépare l’appel API Together.ai
    headers = {
        "Authorization": f"Bearer {TOGETHER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
        # "prompt": f"[INST] {prompt} [/INST]",
        "prompt": (
            "[INST] Tu es Tsinjo, une IA amicale et bienveillante qui aide l'utilisateur. Et tu parles français.\n\n"
            f"Utilisateur: {prompt}\n\nTsinjo:"
            " [/INST]"
        ),
        "max_tokens": 200,
        "temperature": 0.7,
    }

    try:
        res = requests.post("https://api.together.xyz/v1/completions", json=payload, headers=headers)
        res.raise_for_status()
        response_data = res.json()
        ai_message = response_data["choices"][0]["text"]

        # Sauvegarde la réponse IA
        Message.objects.create(
            conversation=conversation,
            sender="ai",
            content=ai_message
        )

        return Response({
            "conversation_id": conversation.id,
            "response": ai_message
        })

    except requests.RequestException as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def conversation_list(request):
    user = request.user
    conversations = Conversation.objects.filter(user=user).order_by('-created_at')
    serializer = ConversationSerializer(conversations, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def conversation_messages(request, conversation_id):
    try:
        conversation = Conversation.objects.get(id=conversation_id, user=request.user)
    except Conversation.DoesNotExist:
        return Response({"detail": "Conversation introuvable."}, status=status.HTTP_404_NOT_FOUND)

    messages = Message.objects.filter(conversation=conversation).order_by("timestamp")
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def voice_chat(request):
    try:
        # 1. Récupère le fichier audio envoyé (form-data)
        audio_file = request.FILES.get("audio")
        if not audio_file:
            return Response({"reply": "Aucun fichier audio reçu."}, status=400)

        # Sauvegarde temporaire du fichier audio pour Whisper
        with tempfile.NamedTemporaryFile(suffix=".webm") as tmp:
            for chunk in audio_file.chunks():
                tmp.write(chunk)
            tmp.flush()

            # 2. Transcription audio → texte avec Whisper
            transcription = model_whisper.transcribe(tmp.name)
            user_message = transcription.get("text", "").strip()

        if not user_message:
            return Response({"reply": "Je n'ai rien compris à l'audio."}, status=400)

        print("✅ Message transcrit:", user_message)

        # 3. Appel API Groq (Llama)
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return Response({"reply": "Clé API manquante."}, status=500)

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": user_message}],
            "max_tokens": 200,
            "temperature": 0.7,
        }

        response = requests.post(GROQ_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        reply_text = data["choices"][0]["message"]["content"]
        print("🌐 Réponse Groq:", reply_text)

        # 4. Texte → audio avec gTTS (Google Text-to-Speech)
        tts = gTTS(text=reply_text, lang="fr")
        with tempfile.NamedTemporaryFile(suffix=".mp3") as tmp_audio:
            tts.save(tmp_audio.name)
            tmp_audio.seek(0)
            audio_data = tmp_audio.read()

        # 5. Retourne audio binaire encodé en base64 + texte
        import base64
        audio_base64 = base64.b64encode(audio_data).decode("utf-8")

        return Response({
            "reply": reply_text,
            "audio_base64": audio_base64,
            "audio_format": "mp3"
        })

    except Exception as e:
        print("❌ Exception attrapée:", str(e))
        return Response({"reply": "Erreur serveur.", "error": str(e)}, status=500)

