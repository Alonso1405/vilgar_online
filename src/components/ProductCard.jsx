import { useState } from "react";

function ProductCard({ producto, agregarAlCarrito }) {
  const [presentacionSeleccionada, setPresentacionSeleccionada] = useState(
    producto.presentaciones[0],
  );

  const [cantidad, setCantidad] = useState(1);
  const [imagenError, setImagenError] = useState(false);

  const aumentarCantidad = () => {
    setCantidad((cantidadActual) => cantidadActual + 1);
  };

  const disminuirCantidad = () => {
    setCantidad((cantidadActual) =>
      cantidadActual > 1 ? cantidadActual - 1 : 1,
    );
  };

  const cambiarPresentacion = (presentacion) => {
    setPresentacionSeleccionada(presentacion);
    setCantidad(1);
    setImagenError(false);
  };

  const total = presentacionSeleccionada.precio * cantidad;

  const agregarProducto = () => {
    agregarAlCarrito({
      productoId: producto.id,

      marca: producto.marca,

      nombre: producto.nombre,

      sku: presentacionSeleccionada.sku,

      presentacion: presentacionSeleccionada.nombre,

      precio: presentacionSeleccionada.precio,

      cantidad,

      subtotal: total,
    });
  };

  return (
    <article className="product-card">
      {/* ================= IMAGEN ================= */}

      <div className="product-image">
        {!imagenError ? (
          <img
            key={presentacionSeleccionada.sku}
            src={`/productos/${presentacionSeleccionada.sku}.png`}
            alt={`${producto.marca} ${producto.nombre} ${presentacionSeleccionada.nombre}`}
            onError={() => setImagenError(true)}
          />
        ) : (
          <div className="product-placeholder">
            <span>VILGAR</span>
            <small>{producto.marca}</small>
          </div>
        )}
      </div>

      {/* ================= INFORMACIÓN ================= */}

      <div className="product-info">
        <span className="product-brand">{producto.marca}</span>

        <h3>{producto.nombre}</h3>

        <p className="product-description">{producto.descripcion}</p>

        {/* ================= PRESENTACIONES ================= */}

        <div className="presentation-title">Presentación</div>

        <div className="presentation-list">
          {producto.presentaciones.map((presentacion) => (
            <button
              key={presentacion.sku}
              className={
                presentacionSeleccionada.sku === presentacion.sku
                  ? "presentation-button active"
                  : "presentation-button"
              }
              onClick={() => cambiarPresentacion(presentacion)}
            >
              {presentacion.nombre}
            </button>
          ))}
        </div>

        {/* ================= PRECIO ================= */}

        <div className="product-price">
          ${presentacionSeleccionada.precio.toFixed(2)}
        </div>

        <div className="product-sku">SKU: {presentacionSeleccionada.sku}</div>

        {/* ================= CANTIDAD ================= */}

        <div className="quantity-title">Cantidad</div>

        <div className="quantity-control">
          <button onClick={disminuirCantidad}>−</button>

          <span>{cantidad}</span>

          <button onClick={aumentarCantidad}>+</button>
        </div>

        {/* ================= TOTAL ================= */}

        <div className="product-total">Total: ${total.toFixed(2)}</div>

        {/* ================= CARRITO ================= */}

        <button className="add-button" onClick={agregarProducto}>
          🛒 AGREGAR AL CARRITO
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
