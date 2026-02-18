import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        welcome: "Welcome",
        login: "Login",
        loginFormDescription:
          "Enter your email below to login to your account",
        forgotYourPassword: "Forgot your password?",
        email: "Email",
        password: "Password",
        adminPanel: "Admin Panel",
        administrator: "Administrator",
        validation: {
          required: "This field is required",
          invalidEmail: "Invalid email address",
          passwordMin: "Password must be at least 8 characters",
          passwordMax: "Password must be at most 64 characters",
          passwordPattern:
            "Password must contain uppercase, lowercase, number, and special character"
        }
      },
    },

    es: {
      translation: {
        welcome: "Bienvenido",
        login: "Iniciar sesión",
        loginFormDescription:
          "Introduzca su correo electrónico debajo para iniciar sesión",
        forgotYourPassword: "¿Olvidó su contraseña?",
        email: "Correo electrónico",
        password: "Contraseña",
        adminPanel: "Panel de Administrador",
        administrator: "Administrador",
        validation: {
          required: "Este campo es obligatorio",
          invalidEmail: "Correo electrónico inválido",
          passwordMin: "La contraseña debe tener al menos 8 caracteres",
          passwordMax: "La contraseña debe tener como máximo 64 caracteres",
          passwordPattern:
            "La contraseña debe contener mayúsculas, minúsculas, número y carácter especial"
        }
      },
    },
  },

  lng: "es",
  fallbackLng: "es",

  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
