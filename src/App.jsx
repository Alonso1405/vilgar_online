import { useEffect, useState } from "react";
import "./App.css";
import ProductCard from "./components/ProductCard";
import { cargarProductosDesdeExcel } from "./utils/excelProducts";
import configuracionTienda from "./config/tienda";
import Swal from "sweetalert2";

function App() {
  const [carrito, setCarrito] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [cliente, setCliente] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    calle: "",
    colonia: "",
    municipio: "",
    codigoPostal: "",
    notas: "",
  });
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [marcaFiltro, setMarcaFiltro] = useState("TODAS");
  const [orden, setOrden] = useState("nombre");
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const manejarInstalacion = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", manejarInstalacion);

    return () => {
      window.removeEventListener("beforeinstallprompt", manejarInstalacion);
    };
  }, []);

  const instalarVILGAR = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();

    const resultado = await installPrompt.userChoice;

    if (resultado.outcome === "accepted") {
      console.log("VILGAR fue instalada");
    }

    setInstallPrompt(null);
  };

  const productosFiltrados = productos
    .filter((producto) => {
      const texto = busqueda.toLowerCase().trim();

      const coincideBusqueda =
        producto.nombre.toLowerCase().includes(texto) ||
        producto.marca.toLowerCase().includes(texto) ||
        producto.presentaciones.some(
          (presentacion) =>
            presentacion.nombre.toLowerCase().includes(texto) ||
            presentacion.sku.toLowerCase().includes(texto),
        );

      const coincideMarca =
        marcaFiltro === "TODAS" || producto.marca === marcaFiltro;

      return coincideBusqueda && coincideMarca;
    })
    .sort((a, b) => {
      if (orden === "nombre") {
        return a.nombre.localeCompare(b.nombre);
      }

      if (orden === "precio-menor") {
        return a.presentaciones[0].precio - b.presentaciones[0].precio;
      }

      if (orden === "precio-mayor") {
        return b.presentaciones[0].precio - a.presentaciones[0].precio;
      }

      return 0;
    });

  const marcas = [
    "TODAS",
    ...new Set(productos.map((producto) => producto.marca)),
  ];

  const agregarAlCarrito = (producto) => {
    setCarrito((carritoActual) => {
      const existente = carritoActual.find((item) => item.sku === producto.sku);

      if (existente) {
        return carritoActual.map((item) =>
          item.sku === producto.sku
            ? {
                ...item,
                cantidad: item.cantidad + producto.cantidad,
              }
            : item,
        );
      }

      return [...carritoActual, producto];
    });
  };

  const enviarPedidoWhatsApp = () => {
    if (carrito.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Carrito vacío",
        text: "Agrega al menos un producto antes de continuar.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    if (
      !cliente.nombre ||
      !cliente.telefono ||
      !cliente.calle ||
      !cliente.colonia ||
      !cliente.municipio ||
      !cliente.codigoPostal
    ) {
      Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Por favor completa todos los campos obligatorios.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    const total = carrito.reduce((suma, item) => suma + item.subtotal, 0);

    let mensaje = `*NUEVO PEDIDO - ${configuracionTienda.nombre}*\n\n`;

    mensaje += `*DATOS DEL CLIENTE*\n`;
    mensaje += `Nombre: ${cliente.nombre}\n`;
    mensaje += `Teléfono: ${cliente.telefono}\n`;

    if (cliente.correo) {
      mensaje += `Correo: ${cliente.correo}\n`;
    }

    mensaje += `\n*PRODUCTOS*\n`;

    carrito.forEach((item, index) => {
      mensaje += `\n${index + 1}. ${item.marca} ${item.nombre}\n`;
      mensaje += `   Presentación: ${item.presentacion}\n`;
      mensaje += `   SKU: ${item.sku}\n`;
      mensaje += `   Cantidad: ${item.cantidad}\n`;
      mensaje += `   Precio: $${item.precio.toFixed(2)}\n`;
      mensaje += `   Subtotal: $${item.subtotal.toFixed(2)}\n`;
    });

    mensaje += `\n*TOTAL DEL PEDIDO: $${total.toFixed(2)}*\n`;

    mensaje += `\n*DIRECCIÓN DE ENTREGA*\n`;
    mensaje += `Calle y número: ${cliente.calle}\n`;
    mensaje += `Colonia: ${cliente.colonia}\n`;
    mensaje += `Municipio: ${cliente.municipio}\n`;
    mensaje += `Código Postal: ${cliente.codigoPostal}\n`;

    if (cliente.notas) {
      mensaje += `\n*NOTAS*\n`;
      mensaje += `${cliente.notas}\n`;
    }

    mensaje += `\nGracias por tu pedido.`;

    const numeroWhatsApp = configuracionTienda.whatsapp.numero;

    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(
      mensaje,
    )}`;

    window.open(url, "_blank");

    // Mostrar confirmación
    setFormularioAbierto(false);

    // Vaciar carrito
    setCarrito([]);

    // Limpiar datos del cliente
    setCliente({
      nombre: "",
      telefono: "",
      correo: "",
      calle: "",
      colonia: "",
      municipio: "",
      codigoPostal: "",
      notas: "",
    });

    // Mostrar mensaje de confirmación
    setTimeout(() => {
      Swal.fire({
        icon: "success",
        title: "¡Pedido preparado!",
        text: "El pedido está listo en WhatsApp. Solo debes presionar ENVIAR.",
        confirmButtonText: "Entendido",
      });
    }, 300);
  };

  useEffect(() => {
    async function cargarCatalogo() {
      try {
        setCargando(true);

        const productosExcel = await cargarProductosDesdeExcel();

        setProductos(productosExcel);
      } catch (error) {
        console.error(error);

        setError("No se pudo cargar el catálogo de productos.");
      } finally {
        setCargando(false);
      }
    }

    cargarCatalogo();
  }, []);

  return (
    <div className="app">
      {/* ================= HEADER ================= */}

      <header className="header">
        <div className="header-container">
          <div className="logo">
            <img src="/logo-vilgar.png" alt="VILGAR - Productos de limpieza" />
          </div>

          <nav className="nav">
            <a href="#">Inicio</a>
            <a href="#productos">Productos</a>
            <a href="#nosotros">Nosotros</a>
            <a href="#contacto">Contacto</a>
          </nav>

          <div className="header-actions">
            <button
              className="search-button"
              onClick={() => setBusquedaAbierta(!busquedaAbierta)}
              aria-label="Buscar productos"
            >
              🔍
            </button>

            {installPrompt && (
              <button className="install-button" onClick={instalarVILGAR}>
                📲 Instalar VILGAR
              </button>
            )}

            {/* Carrito */}
            <button
              className="cart-button"
              onClick={() => setCarritoAbierto(true)}
            >
              🛒
              <span className="cart-count">
                {carrito.reduce((total, item) => total + item.cantidad, 0)}
              </span>
            </button>
          </div>
        </div>
      </header>

      {busquedaAbierta && (
        <div className="search-overlay">
          <div className="search-container">
            <div className="search-input-wrapper">
              <span>🔍</span>

              <input
                type="text"
                autoFocus
                placeholder="Buscar productos, SKU o presentación..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />

              {busqueda && (
                <button
                  className="search-clear"
                  onClick={() => setBusqueda("")}
                >
                  ✕
                </button>
              )}
            </div>

            <button
              className="search-close"
              onClick={() => setBusquedaAbierta(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ================= CARRITO ================= */}
      {carritoAbierto && (
        <div className="cart-overlay">
          <div className="cart-panel">
            <div className="cart-header">
              <h2>Mi carrito</h2>

              <button
                className="cart-close"
                onClick={() => setCarritoAbierto(false)}
              >
                ✕
              </button>
            </div>

            {carrito.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon">🛒</div>
                <h3>Tu carrito está vacío</h3>
                <p>Agrega productos para comenzar tu pedido.</p>

                <button onClick={() => setCarritoAbierto(false)}>
                  VER PRODUCTOS
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {carrito.map((item) => (
                    <div className="cart-item" key={item.sku}>
                      <div className="cart-item-info">
                        <span className="cart-item-brand">{item.marca}</span>

                        <h3>{item.nombre}</h3>

                        <p>Presentación: {item.presentacion}</p>

                        <p className="cart-item-price">
                          ${item.precio.toFixed(2)}
                        </p>
                      </div>

                      <div className="cart-item-bottom">
                        <div className="cart-quantity">
                          <button
                            onClick={() => {
                              setCarrito((carritoActual) =>
                                carritoActual.map((producto) =>
                                  producto.sku === item.sku
                                    ? {
                                        ...producto,
                                        cantidad:
                                          producto.cantidad > 1
                                            ? producto.cantidad - 1
                                            : 1,
                                        subtotal:
                                          producto.precio *
                                          (producto.cantidad > 1
                                            ? producto.cantidad - 1
                                            : 1),
                                      }
                                    : producto,
                                ),
                              );
                            }}
                          >
                            −
                          </button>

                          <span>{item.cantidad}</span>

                          <button
                            onClick={() => {
                              setCarrito((carritoActual) =>
                                carritoActual.map((producto) =>
                                  producto.sku === item.sku
                                    ? {
                                        ...producto,
                                        cantidad: producto.cantidad + 1,
                                        subtotal:
                                          producto.precio *
                                          (producto.cantidad + 1),
                                      }
                                    : producto,
                                ),
                              );
                            }}
                          >
                            +
                          </button>
                        </div>

                        <strong>${item.subtotal.toFixed(2)}</strong>
                      </div>

                      <button
                        className="remove-item"
                        onClick={() => {
                          setCarrito((carritoActual) =>
                            carritoActual.filter(
                              (producto) => producto.sku !== item.sku,
                            ),
                          );
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Total</span>

                    <strong>
                      $
                      {carrito
                        .reduce((total, item) => total + item.subtotal, 0)
                        .toFixed(2)}
                    </strong>
                  </div>

                  <button
                    className="checkout-button"
                    onClick={() => {
                      setCarritoAbierto(false);
                      setFormularioAbierto(true);
                    }}
                  >
                    FINALIZAR PEDIDO
                  </button>

                  <button className="clear-cart" onClick={() => setCarrito([])}>
                    Vaciar carrito
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= HERO ================= */}

      {/* ================= FORMULARIO CLIENTE ================= */}

      {formularioAbierto && (
        <div className="checkout-overlay">
          <div className="checkout-panel">
            <div className="checkout-header">
              <div>
                <span className="checkout-small">VILGAR</span>

                <h2>Finalizar pedido</h2>
              </div>

              <button
                className="checkout-close"
                onClick={() => setFormularioAbierto(false)}
              >
                ✕
              </button>
            </div>

            <div className="checkout-body">
              <h3>Datos del cliente</h3>

              {/* NOMBRE */}

              <div className="form-group">
                <label>Nombre completo *</label>

                <input
                  type="text"
                  value={cliente.nombre}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      nombre: e.target.value,
                    })
                  }
                  placeholder="Nombre completo"
                />
              </div>

              {/* TELEFONO */}

              <div className="form-group">
                <label>Teléfono / WhatsApp *</label>

                <input
                  type="tel"
                  value={cliente.telefono}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      telefono: e.target.value,
                    })
                  }
                  placeholder="55 1234 5678"
                />
              </div>

              {/* CORREO */}

              <div className="form-group">
                <label>Correo electrónico</label>

                <input
                  type="email"
                  value={cliente.correo}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      correo: e.target.value,
                    })
                  }
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <h3 className="address-title">Dirección de entrega</h3>

              {/* CALLE */}

              <div className="form-group">
                <label>Calle y número *</label>

                <input
                  type="text"
                  value={cliente.calle}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      calle: e.target.value,
                    })
                  }
                  placeholder="Calle y número"
                />
              </div>

              {/* COLONIA */}

              <div className="form-group">
                <label>Colonia *</label>

                <input
                  type="text"
                  value={cliente.colonia}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      colonia: e.target.value,
                    })
                  }
                  placeholder="Colonia"
                />
              </div>

              {/* MUNICIPIO */}

              <div className="form-group">
                <label>Municipio *</label>

                <input
                  type="text"
                  value={cliente.municipio}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      municipio: e.target.value,
                    })
                  }
                  placeholder="Municipio"
                />
              </div>

              {/* CP */}

              <div className="form-group">
                <label>Código Postal *</label>

                <input
                  type="text"
                  value={cliente.codigoPostal}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      codigoPostal: e.target.value,
                    })
                  }
                  placeholder="Código Postal"
                />
              </div>

              {/* NOTAS */}

              <div className="form-group">
                <label>Notas del pedido</label>

                <textarea
                  value={cliente.notas}
                  onChange={(e) =>
                    setCliente({
                      ...cliente,
                      notas: e.target.value,
                    })
                  }
                  placeholder="Alguna indicación para la entrega..."
                  rows="4"
                />
              </div>

              {/* TOTAL */}

              <div className="checkout-total">
                <span>Total del pedido</span>

                <strong>
                  $
                  {carrito
                    .reduce((total, item) => total + item.subtotal, 0)
                    .toFixed(2)}
                </strong>
              </div>

              <button
                className="whatsapp-button"
                onClick={enviarPedidoWhatsApp}
              >
                📱 ENVIAR PEDIDO POR WHATSAPP
              </button>
            </div>
          </div>
        </div>
      )}

      <main>
        <section className="hero">
          <div className="hero-container">
            <div className="hero-content">
              <span className="hero-label">VILGAR · PRODUCTOS DE LIMPIEZA</span>

              <h1>
                Limpieza que hace
                <br />
                la diferencia
              </h1>

              <p>Productos de limpieza para tu hogar, negocio y empresa.</p>

              <div className="hero-actions">
                <a href="#productos" className="hero-button">
                  VER PRODUCTOS
                </a>

                <button
                  className="hero-whatsapp"
                  onClick={() => {
                    window.open(
                      `https://wa.me/${configuracionTienda.whatsapp.numero}`,
                      "_blank",
                    );
                  }}
                >
                  <svg
                    className="whatsapp-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M20.52 3.48A11.85 11.85 0 0 0 12.08 0C5.54 0 .22 5.32.22 11.86c0 2.09.55 4.13 1.59 5.92L.12 24l6.36-1.67a11.86 11.86 0 0 0 5.59 1.42h.01c6.54 0 11.86-5.32 11.86-11.86 0-3.17-1.23-6.15-3.42-8.41ZM12.08 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.77.99 1.01-3.68-.23-.38a9.84 9.84 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 7c-.01 5.46-4.45 9.9-9.9 9.9Zm5.42-7.41c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.5 1.7.64.71.23 1.35.2 1.86.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
                      fill="currentColor"
                    />
                  </svg>
                  WHATSAPP
                </button>
              </div>

              <div className="hero-benefits">
                <div>
                  <strong>30+</strong>
                  <span>Productos</span>
                </div>

                <div>
                  <strong>85+</strong>
                  <span>Presentaciones</span>
                </div>

                <div>
                  <strong>VILGAR</strong>
                  <span>Calidad</span>
                </div>
              </div>
            </div>

            <div className="hero-products">
              {productos[0]?.presentaciones[0] && (
                <div className="hero-product-main">
                  <img
                    src={`/productos/${productos[0].presentaciones[0].sku}.png`}
                    alt={`${productos[0].marca} ${productos[0].nombre}`}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================= PRODUCTOS ================= */}

        <section className="products-section" id="productos">
          {/* Título de productos */}
          <div className="section-header">
            <span className="section-label">NUESTROS PRODUCTOS</span>
            <h2>Productos de limpieza</h2>
            <p>Encuentra los productos que necesitas.</p>
          </div>

          {/* BUSCADOR Y FILTROS */}
          <div className="products-filters">
            <div className="filter-group">
              <label>Marca</label>

              <select
                value={marcaFiltro}
                onChange={(e) => setMarcaFiltro(e.target.value)}
              >
                {marcas.map((marca) => (
                  <option key={marca} value={marca}>
                    {marca}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Ordenar</label>

              <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                <option value="nombre">Nombre A-Z</option>
                <option value="precio-menor">Precio menor a mayor</option>
                <option value="precio-mayor">Precio mayor a menor</option>
              </select>
            </div>
          </div>

          {/* CONTADOR */}
          <div className="products-results">
            <span>{productosFiltrados.length} productos encontrados</span>
          </div>

          {/* PRODUCTOS */}
          <div className="products-grid">
            {productosFiltrados.map((producto) => (
              <ProductCard
                key={producto.id}
                producto={producto}
                agregarAlCarrito={agregarAlCarrito}
              />
            ))}
          </div>
        </section>
      </main>

      <section className="about-section" id="nosotros">
        <div className="about-container">
          <div className="about-image">
            <img src="/logo-vilgar.png" alt="VILGAR Productos de Limpieza" />
          </div>

          <div className="about-content">
            <span className="section-label">SOBRE VILGAR</span>

            <h2>
              Limpieza que hace
              <br />
              la diferencia
            </h2>

            <p>
              En VILGAR ofrecemos productos de limpieza pensados para cubrir las
              necesidades del hogar, comercios, empresas e industria.
            </p>

            <p>
              Nuestro catálogo cuenta con diferentes productos y presentaciones
              para que puedas encontrar la solución adecuada para cada necesidad
              de limpieza.
            </p>

            <div className="about-values">
              <div className="about-value">
                <strong>HOGAR</strong>
                <span>Productos para tu hogar</span>
              </div>

              <div className="about-value">
                <strong>EMPRESAS</strong>
                <span>Soluciones para negocios</span>
              </div>

              <div className="about-value">
                <strong>INDUSTRIA</strong>
                <span>Presentaciones para mayor consumo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contacto">
        <div className="contact-container">
          <div className="contact-header">
            <span className="section-label">CONTACTO</span>

            <h2>¿Tienes alguna pregunta?</h2>

            <p>
              Estamos para ayudarte. Contáctanos para conocer nuestros
              productos, presentaciones y opciones de compra.
            </p>
          </div>

          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">💬</div>

              <h3>WhatsApp</h3>

              <p>
                Escríbenos directamente para realizar tu pedido o solicitar
                información.
              </p>

              <button
                onClick={() => {
                  window.open(
                    `https://wa.me/${configuracionTienda.whatsapp.numero}`,
                    "_blank",
                  );
                }}
              >
                CONTACTAR
              </button>
            </div>

            <div className="contact-card">
              <div className="contact-icon">📦</div>

              <h3>Productos</h3>

              <p>
                Consulta nuestro catálogo y encuentra la presentación que
                necesitas.
              </p>

              <a href="#productos">VER PRODUCTOS</a>
            </div>

            <div className="contact-card">
              <div className="contact-icon">🏢</div>

              <h3>Empresas</h3>

              <p>Tenemos opciones para comercios, negocios y empresas.</p>

              <button
                onClick={() => {
                  window.open(
                    `https://wa.me/${configuracionTienda.whatsapp.numero}`,
                    "_blank",
                  );
                }}
              >
                SOLICITAR INFORMACIÓN
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          {/* INFORMACIÓN DE VILGAR */}
          <div className="footer-column footer-brand">
            <img
              src="/logo-vilgar.png"
              alt="VILGAR Productos de Limpieza"
              className="footer-logo"
            />

            <p>
              Productos de limpieza para tu hogar, negocio, empresa e industria.
            </p>

            <button
              className="footer-whatsapp"
              onClick={() => {
                window.open(
                  `https://wa.me/${configuracionTienda.whatsapp.numero}`,
                  "_blank",
                );
              }}
            >
              <svg
                className="whatsapp-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M20.52 3.48A11.85 11.85 0 0 0 12.08 0C5.54 0 .22 5.32.22 11.86c0 2.09.55 4.13 1.59 5.92L.12 24l6.36-1.67a11.86 11.86 0 0 0 5.59 1.42h.01c6.54 0 11.86-5.32 11.86-11.86 0-3.17-1.23-6.15-3.42-8.41ZM12.08 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.77.99 1.01-3.68-.23-.38a9.84 9.84 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 7c-.01 5.46-4.45 9.9-9.9 9.9Zm5.42-7.41c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.5 1.7.64.71.23 1.35.2 1.86.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
                  fill="currentColor"
                />
              </svg>
              CONTACTAR POR WHATSAPP
            </button>
          </div>

          {/* ENLACES */}
          <div className="footer-column">
            <h3>VILGAR</h3>

            <a href="#">Inicio</a>

            <a href="#productos">Productos</a>

            <a href="#productos">Catálogo</a>

            <a href="#">Nosotros</a>
          </div>

          {/* PRODUCTOS */}
          <div className="footer-column">
            <h3>PRODUCTOS</h3>

            <a href="#productos">Productos NOW</a>

            <a href="#productos">Productos SENSACIONAL</a>

            <a href="#productos">Limpieza del hogar</a>

            <a href="#productos">Limpieza empresarial</a>
          </div>

          {/* CONTACTO */}
          <div className="footer-column">
            <h3>CONTACTO</h3>

            <p>Atención a clientes</p>

            <p>WhatsApp</p>

            <p>Hogar · Empresas · Industria</p>
          </div>
        </div>

        {/* PARTE INFERIOR */}
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} VILGAR. Todos los derechos reservados.
          </p>

          <p>Productos de limpieza</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
