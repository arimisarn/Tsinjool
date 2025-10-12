import React, { useEffect, useState } from "react";
import { Brain, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

export default function ConfirmEmailPage() {
  useEffect(() => {
    document.title = "Tsinjool - Confirmation Email";
  }, []);
  const navigate = useNavigate();
  const location = useLocation();

  const initialEmail =
    (location.state as { email?: string })?.email ||
    sessionStorage.getItem("pendingEmail") ||
    "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !code) {
      toast.error("Veuillez renseigner l'email et le code.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        "https://backend-tsinjool.onrender.com/api/confirm-email/",
        { email, code }
      );
      toast.success("Email confirmé avec succès !");

      const password = sessionStorage.getItem("pendingPassword");
      const username = sessionStorage.getItem("pendingUsername");

      if (!username || !password) {
        toast.error(
          "Identifiants manquants. Veuillez vous connecter manuellement."
        );
        navigate("/login");
        return;
      }

      const loginRes = await axios.post(
        "https://backend-tsinjool.onrender.com/api/login/",
        { username: username, password }
      );
      const token = loginRes.data.token;
      localStorage.setItem("token", token);
      sessionStorage.removeItem("pendingPassword");
      sessionStorage.removeItem("pendingUsername");
      sessionStorage.removeItem("pendingEmail");

      toast.success("Connecté automatiquement !");
      navigate("/profile-setup");
    } catch (error: unknown) {
      // Typage safe pour axios error
      let msg = "Erreur lors de la confirmation.";
      if (axios.isAxiosError(error)) {
        if (error.response?.data) {
          const data = error.response.data as Record<string, any>;
          if (data.error) msg = data.error;
          else if (typeof data === "string") msg = data;
          else if (Array.isArray(data)) msg = data.join(", ");
          else msg = JSON.stringify(data);
        }
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 flex items-center justify-center p-2 sm:p-4 transition-colors duration-500">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[500px]">
        {/* Section formulaire */}
        <div className="w-full lg:w-3/5 flex flex-col relative">
          {/* Header avec logo */}
          <div className="flex justify-between items-center p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Tsinjool
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Votre coach personnel intelligent
                </p>
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <form
            onSubmit={handleConfirm}
            className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8"
            noValidate
          >
            <div className="w-full max-w-md">
              <div className="mb-6 sm:mb-8">
                <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                  ÉTAPE 1 SUR 2
                </p>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  Confirmez votre email
                  <span className="text-purple-500">.</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Entrez le code reçu par email pour activer votre compte.
                </p>
              </div>

              <div className="space-y-6">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@example.com"
                    required
                    disabled={!!initialEmail}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Code */}
                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Code de confirmation
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Entrez le code"
                    required
                    maxLength={6}
                    style={{ letterSpacing: "0.3em" }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 text-gray-900 dark:text-white font-mono text-center tracking-widest text-xl"
                  />
                </div>

                {/* Boutons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center gap-2 py-3 px-4 sm:px-6 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 font-medium group order-2 sm:order-1"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transform transition-transform duration-300 group-hover:-translate-x-1" />
                    <span className="text-sm sm:text-base">Retour</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 sm:px-6 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 order-1 sm:order-2"
                  >
                    {loading ? "Confirmation..." : "Confirmer"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Section décorative */}
        <div className="w-full lg:w-2/5 relative overflow-hidden min-h-[250px] sm:min-h-[300px] lg:min-h-full">
          <div className="w-full h-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 relative">
            {/* Image de fond */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
              style={{
                backgroundImage: `url(https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop)`,
              }}
            />

            {/* Overlay décoratif */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

            {/* Contenu */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 text-white">
              <div className="mb-6 sm:mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                  Presque terminé !
                </h3>
                <p className="text-base sm:text-lg font-light max-w-sm">
                  Entrez le code pour activer votre compte Tsinjool.
                  Veuillez consulter votre SPAM si vous ne le voyez pas.
                </p>
              </div>

              {/* Étapes */}
              <div className="flex items-center space-x-2 sm:space-x-4 mb-6 sm:mb-8">
                <div className="flex items-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                  </div>
                  <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-white/90">
                    Confirmer Email
                  </span>
                </div>
                <div className="w-4 sm:w-8 h-0.5 bg-white/30"></div>
                <div className="flex items-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/30 rounded-full flex items-center justify-center">
                    <span className="text-purple-500 font-bold text-xs sm:text-sm">
                      2
                    </span>
                  </div>
                  <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-white/70">
                    Profil
                  </span>
                </div>
              </div>
            </div>

            {/* Éléments décoratifs animés */}
            <div className="absolute top-4 sm:top-8 left-4 sm:left-8 w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full blur-sm animate-pulse"></div>
            <div className="absolute top-1/4 right-6 sm:right-12 w-16 h-16 sm:w-24 sm:h-24 bg-white/5 rounded-full blur-lg animate-pulse delay-300"></div>
            <div className="absolute bottom-1/4 left-6 sm:left-12 w-14 h-14 sm:w-20 sm:h-20 bg-white/15 rounded-full blur-md animate-pulse delay-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
