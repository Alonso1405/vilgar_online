const productos = [
  {
    id: 1,
    marca: "NOW",
    nombre: "Limpiador Brisa Marina",
    categoria: "Limpiadores",
    descripcion: "Limpiador para diferentes superficies.",
    presentaciones: [
      {
        id: "1L",
        nombre: "1 L",
        precio: 50,
      },
      {
        id: "5L",
        nombre: "5 L",
        precio: 180,
      },
      {
        id: "10L",
        nombre: "10 L",
        precio: 320,
      },
      {
        id: "20L",
        nombre: "20 L",
        precio: 580,
      },
    ],
    imagen: "/productos/now-brisa-marina.jpg",
    destacado: true,
  },

  {
    id: 2,
    marca: "NOW",
    nombre: "Limpiador Mixto de Frutas",
    categoria: "Limpiadores",
    descripcion: "Limpiador con agradable aroma frutal.",
    presentaciones: [
      {
        id: "1L",
        nombre: "1 L",
        precio: 50,
      },
      {
        id: "5L",
        nombre: "5 L",
        precio: 180,
      },
      {
        id: "20L",
        nombre: "20 L",
        precio: 580,
      },
    ],
    imagen: "/productos/now-mixto-frutas.jpg",
    destacado: true,
  },

  {
    id: 3,
    marca: "NOW",
    nombre: "Suavizante",
    categoria: "Suavizantes",
    descripcion: "Suavizante para ropa.",
    presentaciones: [
      {
        id: "1L",
        nombre: "1 L",
        precio: 50,
      },
      {
        id: "5L",
        nombre: "5 L",
        precio: 180,
      },
      {
        id: "10L",
        nombre: "10 L",
        precio: 320,
      },
      {
        id: "20L",
        nombre: "20 L",
        precio: 580,
      },
    ],
    imagen: "/productos/now-suavizante.jpg",
    destacado: true,
  },
];

export default productos;
