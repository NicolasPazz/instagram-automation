import { Page } from "playwright";

// Función para hacer una pausa aleatoria
export function randomDelay(min: number, max: number): Promise<void> {
  return new Promise((resolve) => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(resolve, delay);
  });
}

// Función para verificar si estamos al final de un contenedor
export async function checkScroll(page: Page, contenedorSelector: string) {
  const contenedor = await page.$(contenedorSelector);
  if (!contenedor) {
    console.error("checkScroll: Contenedor no encontrado en la página.");
    return false;
  }

  const scrollHeight = await contenedor.evaluate((el) => el.scrollHeight); // Altura total del contenedor
  const scrollTop = await contenedor.evaluate((el) => el.scrollTop); // Altura desplazada
  const clientHeight = await contenedor.evaluate((el) => el.clientHeight); // Altura visible
  const scrollBottom = scrollHeight - scrollTop; // Altura restante
  const isAtBottom = scrollBottom <= clientHeight + 50; // Ajuste flexible

  console.log("Comprobando si está al final de la lista:");
  console.log("  scrollHeight:", scrollHeight);
  console.log("  scrollTop:", scrollTop);
  console.log("  scrollBottom:", scrollBottom);
  console.log("  isAtBottom:", isAtBottom);

  return isAtBottom;
}

// Función para hacer scroll hacia abajo para cargar más contenido
export async function scrollToBottom(page: Page, contenedorSelector: string) {
  const contenedor = await page.$(contenedorSelector);
  if (!contenedor) {
    console.error("scrollToBottom: Contenedor no encontrado en la página.");
    return;
  }

  await contenedor.evaluate((el) => (el.scrollTop = el.scrollHeight)); // Desplaza al fondo
  console.log("Desplazando hacia el fondo...");
}

// Función para calcular el número total de elementos en base al scrollHeight
export async function calcularElementos(page: Page, contenedorSelector: string, alturaElemento: number) {
  const contenedor = await page.$(contenedorSelector);
  if (!contenedor) {
    console.error("calcularElementos: Contenedor no encontrado en la página.");
    return 0;
  }

  const scrollHeight = await contenedor.evaluate((el) => el.scrollHeight);
  console.log("Cálculo de elementos basado en el desplazamiento total (scrollHeight):");
  console.log("  scrollHeight:", scrollHeight);
  const totalElementos = Math.floor(scrollHeight / alturaElemento); // Divide el scrollHeight por la altura de los elementos
  console.log("Elementos encontrados en base al desplazamiento:", totalElementos);
  return totalElementos;
}

// Función para cargar todo el contenido desplazando hacia el fondo
export async function cargarTodoElContenido(page: Page) {
    const contenedorSelector = ".xyi19xy.x1ccrb07.xtf3nb5.x1pc53ja.x1lliihq.x1iyjqo2.xs83m0k.xz65tgg.x1rife3k.x1n2onr6";
    await page.waitForSelector(
      ".xyi19xy.x1ccrb07.xtf3nb5.x1pc53ja.x1lliihq.x1iyjqo2.xs83m0k.xz65tgg.x1rife3k.x1n2onr6",
      { timeout: 10000 } // Espera hasta 10 segundos
    );
    const contenedor = await page.$(
        ".xyi19xy.x1ccrb07.xtf3nb5.x1pc53ja.x1lliihq.x1iyjqo2.xs83m0k.xz65tgg.x1rife3k.x1n2onr6"
    );
    await page.waitForSelector(
        '[role="progressbar"]',
        { timeout: 10000 } // Espera hasta 10 segundos
    );
    const progressBarSelector = '[role="progressbar"]';

  if (!contenedor) {
    console.error("cargarTodoElContenido: Contenedor no encontrado en la página.");
    return;
  }

  await page.waitForSelector(progressBarSelector, { timeout: 10000 });

  let tiempoAlFinal = 0; // Variable para medir el tiempo que se mantiene en el final
  const alturaElemento = 60; // Altura de cada elemento en px

  const cargarMasContenido = async () => {
    const progressBarContainer = await page.$(progressBarSelector);
    if (!progressBarContainer) {
      console.log("No hay más contenido para cargar.");
      await calcularElementos(page, contenedorSelector, alturaElemento);
      return;
    }

    if (await checkScroll(page, contenedorSelector)) {
      if (tiempoAlFinal === 0) {
        console.log("Al final del contenedor, cargando más contenido...");
      }

      tiempoAlFinal += 0.5; // Incrementa el tiempo que esta al final

      if (tiempoAlFinal >= 8) {
        console.log("Se ha mantenido en el final durante 8 segundos. Terminando...");
        await calcularElementos(page, contenedorSelector, alturaElemento);
        return;
      }

      setTimeout(() => cargarMasContenido(), 500);
    } else {
      console.log("No estamos al final, volviendo a desplazarnos...");
      tiempoAlFinal = 0;
      await scrollToBottom(page, contenedorSelector);
      setTimeout(() => cargarMasContenido(), 500); // Reintenta después de 0.5 segundos
    }
  };

  await cargarMasContenido();
}