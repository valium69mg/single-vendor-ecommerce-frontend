import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        welcome: "Welcome",
        login: "Login",
        loginFormDescription: "Enter your email below to login to your account",
        forgotYourPassword: "Forgot your password?",
        email: "Email",
        password: "Password"
      },
    },
    es: {
      translation: {
        welcome: "Bienvenido",
        login: "Iniciar sesión",
        loginFormDescription: "Introduzca su email debajo para iniciar sesión",
        forgotYourPassword: "¿Olvidó su contraseña?",
        email: "Email",
        password: "Contraseña"
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
