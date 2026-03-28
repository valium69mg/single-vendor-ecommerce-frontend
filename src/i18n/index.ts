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
        dashboard: "Dashboard",
        orders: "Orders",
        users: "Users",
        products: "Products",
        categories: "Categories",
        materials: "Materiales",
        brands: "Brands",
        unitsSold: "Units Sold",
        revenue: "Revenue",
        averagePrice: "Average Price",
        stock: "Stock",
        actions: "Actions",
        edit: "Edit",
        delete: "Delete",
        previous: "Previous",
        next: "Next",
        page: "Page",
        noResults: "No results",
        image: "Image",
        cancel: "Cancel",
        areYouSure: "Are you sure?",
        cannotUndo: "This action cannot be undone",
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
        dashboard: "Dashboard",
        orders: "Ordenes",
        users: "Usuarios",
        products: "Productos",
        categories: "Categorías",
        brands: "Marcas",
        materials: "Materiales",
        unitsSold: "Unidades Vendidas",
        revenue: "Ingresos",
        averagePrice: "Precio Promedio",
        stock: "Inventario",
        actions: "Acciones",
        edit: "Editar",
        delete: "Eliminar",
        previous: "Anterior",
        next: "Siguiente",
        page: "Página",
        noResults: "Sin resultados",
        image: "Imágen",
        cancel: "Cancelar",
        areYouSure: "¿Estás seguro?",
        cannotUndo: "Esta accion no se puede revertir",
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
