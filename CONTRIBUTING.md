# 🤝 Guía de Contribución

Gracias por colaborar en este proyecto 🙌  
Aquí se explica **cómo trabajamos en equipo**, el flujo de trabajo con Git, los comandos más comunes y las normas de estilo de código.

---

## 🧩 Flujo de trabajo Git

1. **Clona el repositorio**
   ```bash
   git clone [URL-del-repo]
   ```   

2. **Crea una nueva rama para tu tarea**
   git checkout -b tipo/#id-descripcion

   **Ejemplo**
   ```bash
   git checkout -b feature/#12-añadir-login
   ```

   ```bash
   git checkout -b bug/#34-arreglar-login
   ```

3. **Realiza tus cambios**
   Edita los archivos dentro de src/ o la carpeta correspondiente.
   Guarda, prueba y verifica que todo funcione correctamente.

4. **Sube tus cambios**
   Hacer un commit de los cambios a la rama del feature y haz un push al repositorio

5. **Crea un Pull Request(PR)**
    En GitHub, abre un PR desde tu rama hacia main.
    Asegúrate de vincularlo con el Issue correspondiente (Fixes #n).
    Completa el formulario con la plantilla de PR.  
    Espera revisión y aprobación del Git Master antes del merge.

6. **Merge y Cierre**
    Una vez aprobado el PR, se hace el merge a main.
    El Issue vinculado se cerrará automáticamente.

---

## 💻 Convenciones de código

Para mantener un código limpio y coherente, seguimos estas normas:

🔹 Funciones y métodos

Usa camelCase: aumentarPrecio, obtenerDatosUsuario, guardarRegistro.
Nombres descriptivos que indiquen claramente la acción o propósito.

🔹 Variables

También en camelCase: precioTotal, contadorUsuarios, nombreCliente.
Evita abreviaturas confusas (cntUsr ❌ → contadorUsuarios ✅).

🔹 Constantes

En MAYÚSCULAS_CON_GUIONES_BAJOS:

🔹 Clases

Usa PascalCase: Cliente, ProductoDigital, ControladorUsuario.

🔹 Archivos

Nombres cortos y descriptivos en minúsculas con guiones bajos:

🔹 Comentarios

¡¡¡IMPORTANTE!!! Comentar bien el codigo para que se entienda con solo leerlo.

---

### 🏷️ Etiquetas

- Usa `🐞 bug` Corrección de errores o fallos del sistema
- Usa `💡 feature` Nueva funcionalidad o mejora existente
- Usa `🚧 in progress` Tarea actualmente en desarrollo
- Usa `✅ done` Tarea completada y verificada

---

### 👑 Roles del proyecto

Git Master: Revisa y aprueba PRs, mantiene main estable, gestiona Issues y etiquetas.
Colaborador: Trabaja en ramas propias, crea Issues y PRs siguiendo las normas.

### 📘 Este flujo garantiza orden, claridad y coherencia entre todos los miembros del equipo.

Git Master actual: @elielDev09