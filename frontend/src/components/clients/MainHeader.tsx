import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import pic from "../../assets/avatar.jpg";
import DarkMode from "../theme/DarkMode";
import logo from "../../assets/logoRond.png";
import NotificationDropdown from "./NotificationDropdown";

const MainHeader: React.FC = () => {
  const navigate = useNavigate();
  const daty = new Date();
  const formatDate = daty.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [profilePhoto, setProfilePhoto] = useState(pic);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    "Bienvenue sur Tsinjool 👋",
    "Votre nouveau parcours est prêt !",
    "Rappel : exercice quotidien à faire 💪",
  ]);
  console.log(setNotifications);

  useEffect(() => {
    const loadPhoto = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get(
          "https://tsinjool-backend.onrender.com/api/profile/",
          {
            headers: { Authorization: `Token ${token}` },
          }
        );

        const url = res.data?.photo_url;
        if (url && url.startsWith("http")) {
          setProfilePhoto(url);
        }
      } catch (err) {
        console.error("Erreur chargement photo", err);
      }
    };

    loadPhoto();
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between flex-wrap gap-4 relative">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="logo" className="w-10 h-10" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Tsinjool
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              Votre coach personnel intelligent
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <DarkMode />

          {/* Date */}
          <div className="hidden sm:flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
            <Calendar className="w-4 h-4" />
            {formatDate}
          </div>

          {/* Bell + badge */}
          <div className="relative">
            <NotificationDropdown />
          </div>

          {/* Avatar */}
          <img
            src={profilePhoto}
            alt="Profil utilisateur"
            className="w-9 h-9 rounded-full border-2 border-gray-300 dark:border-white cursor-pointer hover:scale-105 transition"
            onClick={() => navigate("/profile")}
          />
        </div>
      </div>
    </div>
  );
};

export default MainHeader;
