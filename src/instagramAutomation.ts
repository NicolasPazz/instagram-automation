import { chromium, Page, BrowserContext } from "playwright";
import { loginUser, loginPass, targetUser, followersFileName, followingFileName, url_constants, chromeProfilePath } from "./constants";
import { randomDelay, cargarTodoElContenido } from "./utils";
import path from "path";
import fs from "fs";

async function setupBrowser(): Promise<BrowserContext> {
  const browser = await chromium.launch({
    headless: false, // Para que el navegador sea visible
    args: ["--start-maximized"], // Argumento para abrir el navegador maximizado
  });

  // Verificar si existe el archivo de almacenamiento de cookies
  const storageStateFilePath = chromeProfilePath + "/storageState.json";
  let storageState = undefined;

  // Si el archivo de estado de almacenamiento existe, lo carga
  if (fs.existsSync(storageStateFilePath)) {
      console.log("Cargando cookies y estado desde el archivo...");
      storageState = fs.readFileSync(storageStateFilePath, "utf-8");
      storageState = JSON.parse(storageState); // Convertir el JSON en un objeto
  }

  const context = await browser.newContext({
      storageState: storageState ? storageState : undefined, // Si existe, se usa el estado cargado
      viewport: null, // Permite que Playwright utilice el tamaño completo de la pantalla
  });

  return context;
}

async function loginToInstagram(page: Page): Promise<void> {
  // Verifica si ya esta logueado mediante cookies
  const cookies = await page.context().cookies();
  if (cookies.some((cookie) => cookie.name === "sessionid")) {
      console.log("Ya estás logueado.");
      return;
  }

  // Si no esta logueado, hacer login
  console.log("Iniciando sesión...");
  await page.goto(`${url_constants}`);

  // Espera a que la página de login cargue
  await page.waitForSelector('input[name="username"]');

  // Ingresa el nombre de usuario y la contraseña
  await randomDelay(1000, 3000);
  await page.fill('input[name="username"]', loginUser);
  await randomDelay(1000, 3000);
  await page.fill('input[name="password"]', loginPass);

  // Espera que el botón de login se habilite y luego hace clic
  await page.waitForSelector('button[type="submit"]:not([disabled])');
  await randomDelay(1000, 3000);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  // Duplica la pestaña, si la URL es la de reactivación
  if (page.url().includes("#reactivated")) {
      console.log(
          "Redirigido a la página de reactivación, duplicando pestaña..."
      );
      const newPage = await page.context().newPage();
      page = newPage; // Asigna la nueva pestaña a la variable de la página
      console.log("Pestaña duplicada.");
  }

  // Espera que la página de inicio cargue después del login
  await page.waitForLoadState("domcontentloaded");
  console.log("Inicio de sesión exitoso");

  // Guarda cookies para usarlas en futuras ejecuciones
  const storageState = await page.context().storageState();
  fs.writeFileSync(
      chromeProfilePath + "/storageState.json",
      JSON.stringify(storageState)
  ); // Guarda el estado de la sesión (cookies)
}

// Función para cargar la lista de seguidores o seguidos y guardar el HTML
async function loadList(page: Page, user: string, type: "followers" | "following") {
  const url = `${url_constants}${user}`;
  await page.goto(url);

  // Selección del enlace correcto según el tipo
  const linkSelector = `a[href="/${user}/${type}/"]`;
  await page.waitForSelector(linkSelector);
  await page.click(linkSelector);
  await page.waitForLoadState("domcontentloaded");

  // Espera que los elementos se carguen
  await page.waitForSelector("span.x1lliihq");

   await cargarTodoElContenido(page);

  // Obtener el contenido HTML y guardarlo
  const htmlContent = await page.content();
  // Definir la ruta para la carpeta de salida
  const outputDir = path.join(__dirname, '..', 'html_output');

  // Crear la carpeta si no existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Definir la ruta completa del archivo
  const fileName = path.join(outputDir, `${type}.html`);

  // Guardar el contenido HTML en la carpeta especificada
  fs.writeFileSync(fileName, htmlContent);

  console.log(`El contenido de los ${type} de ${user} se ha guardado en "${fileName}"`);
}

async function main() {
  const browserContext = await setupBrowser();
  const page = await browserContext.newPage();
  
  // Realizar login
  await loginToInstagram(page);

  // Cargar la lista de seguidores y seguidos
  await loadList(page, targetUser, "followers");
  await loadList(page, targetUser, "following");
  
  // Cerrar el navegador
  await browserContext.close();
}

// Ejecutar el flujo principal
main().catch((error) => {
  console.error("Error durante la ejecución:", error);
});