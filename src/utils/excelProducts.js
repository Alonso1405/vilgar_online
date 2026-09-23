import * as XLSX from "xlsx";

function obtenerCategoria(nombre) {
  const texto = nombre.toLowerCase();

  if (texto.includes("suavizante")) {
    return "Suavizantes";
  }

  if (texto.includes("cloro") || texto.includes("blanqueador")) {
    return "Cloro y blanqueadores";
  }

  if (texto.includes("detergente")) {
    return "Detergentes";
  }

  if (texto.includes("limpiador")) {
    return "Limpiadores";
  }

  if (texto.includes("desengrasante")) {
    return "Desengrasantes";
  }

  if (texto.includes("aromatizante") || texto.includes("aroma")) {
    return "Aromatizantes";
  }

  if (texto.includes("jabon") || texto.includes("jabón")) {
    return "Jabones";
  }

  return "Productos de limpieza";
}

/*
=========================================
  OBTENER NOMBRE BASE DEL PRODUCTO
=========================================
*/

function separarProducto(productoCompleto) {
  const partes = productoCompleto.trim().split(/\s+/);

  const marca = partes.shift();

  const resto = partes.join(" ");

  /*
    Quitamos la presentación del final.

    Ejemplos:

    1 L
    5 L
    10 L
    20 L
    208 L
    1000 L

    También contempla:

    5/1 L
    5+1 L
    10 L MX
    10 L DB
    etc.
  */

  const regexPresentacion =
    /\s+(?:(?:\d+(?:\.\d+)?)|(?:\d+\/\d+)|(?:\d+\+\d+))\s*(?:L|ML|KG|G)\b.*$/i;

  const coincidencia = resto.match(regexPresentacion);

  let nombre;
  let presentacion;

  if (coincidencia) {
    nombre = resto.substring(0, coincidencia.index).trim();

    presentacion = coincidencia[0].trim();
  } else {
    nombre = resto.trim();

    presentacion = "Única";
  }

  return {
    marca,
    nombre,
    presentacion,
  };
}

/*
=========================================
  CARGAR EXCEL
=========================================
*/

export async function cargarProductosDesdeExcel() {
  const respuesta = await fetch("/catalogo.xlsx");

  if (!respuesta.ok) {
    throw new Error("No se pudo encontrar public/catalogo.xlsx");
  }

  const datos = await respuesta.arrayBuffer();

  const workbook = XLSX.read(datos, {
    type: "array",
  });

  const nombreHoja = workbook.SheetNames[0];

  const hoja = workbook.Sheets[nombreHoja];

  const filas = XLSX.utils.sheet_to_json(hoja, {
    defval: "",
  });

  console.log("================================");

  console.log("FILAS DEL EXCEL:", filas.length);

  console.log("================================");

  /*
  ========================================
    AGRUPAR PRODUCTOS
  ========================================
  */

  const productosAgrupados = {};

  filas.forEach((fila) => {
    const sku = String(fila["No. Artículo"] || "").trim();

    const productoCompleto = String(fila["Producto"] || "").trim();

    let precio = fila["Precio final"];

    /*
      Validar producto
    */

    if (!productoCompleto) {
      return;
    }

    /*
      Convertir precio
    */

    if (typeof precio === "string") {
      precio = precio.replace("$", "").replace(/,/g, "").trim();
    }

    precio = Number(precio);

    if (Number.isNaN(precio)) {
      console.warn("Precio inválido:", fila);

      return;
    }

    /*
      Separar producto
    */

    const { marca, nombre, presentacion } = separarProducto(productoCompleto);

    /*
      Crear una llave única
      para agrupar presentaciones
    */

    const clave = `${marca}-${nombre}`;

    /*
      Crear producto si no existe
    */

    if (!productosAgrupados[clave]) {
      productosAgrupados[clave] = {
        id: Object.keys(productosAgrupados).length + 1,

        marca,

        nombre,

        categoria: obtenerCategoria(nombre),

        descripcion: `${marca} ${nombre}`,

        imagen: "",

        destacado: Object.keys(productosAgrupados).length < 6,

        presentaciones: [],
      };
    }

    /*
      Agregar presentación
    */

    productosAgrupados[clave].presentaciones.push({
      sku,

      nombre: presentacion,

      precio: Number(precio.toFixed(2)),
    });
  });

  /*
  ========================================
    CONVERTIR OBJETO A ARRAY
  ========================================
  */

  const productos = Object.values(productosAgrupados);

  /*
  ========================================
    ORDENAR PRESENTACIONES
  ========================================
  */

  productos.forEach((producto) => {
    producto.presentaciones.sort((a, b) => a.precio - b.precio);
  });

  console.log("================================");

  console.log("PRODUCTOS AGRUPADOS:", productos);

  console.log("TOTAL DE PRODUCTOS:", productos.length);

  console.log(
    "TOTAL DE PRESENTACIONES:",
    productos.reduce(
      (total, producto) => total + producto.presentaciones.length,
      0,
    ),
  );

  console.log("================================");

  return productos;
}
