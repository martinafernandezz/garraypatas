import express from 'express';
import mysql from 'mysql2/promise.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Pool de conexiones MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'petshop_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    req.username = decoded.username;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// =====================
// RUTAS DE AUTENTICACIÓN
// =====================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const user = users[0];
    const validPassword = await bcryptjs.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// =====================
// RUTAS DE USUARIOS (CRUD)
// =====================

app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT id, username, email, full_name, role, created_at FROM users ORDER BY created_at DESC');
    connection.release();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.post('/api/users', verifyToken, async (req, res) => {
  try {
    const { username, password, email, fullName, role } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Campos requeridos: username, password, email' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email, fullName || username, role || 'admin']
    );
    connection.release();

    res.status(201).json({ id: result.insertId, message: 'Usuario creado' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

app.put('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const { email, fullName, role } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE users SET email = ?, full_name = ?, role = ? WHERE id = ?',
      [email, fullName, role, req.params.id]
    );
    connection.release();
    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

app.delete('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    connection.release();
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// =====================
// RUTAS DE CATEGORÍAS
// =====================

app.get('/api/categories', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [categories] = await connection.query(`
      SELECT c.id, c.name, c.description, COUNT(p.id) as productCount
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name
    `);
    connection.release();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

app.post('/api/categories', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || '']
    );
    connection.release();
    res.status(201).json({ id: result.insertId, message: 'Categoría creada' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'La categoría ya existe' });
    }
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

app.put('/api/categories/:id', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description, req.params.id]
    );
    connection.release();
    res.json({ message: 'Categoría actualizada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

app.delete('/api/categories/:id', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    connection.release();
    res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

// =====================
// RUTAS DE CLIENTES / CUENTAS CORRIENTES
// =====================

app.get('/api/customers', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [customers] = await connection.query(`
      SELECT c.id, c.first_name, c.last_name, c.phone, c.created_at,
             COALESCE(SUM(CASE WHEN s.payment_status = 'pending' THEN s.total_amount ELSE 0 END), 0) as pendingTotal,
             COUNT(s.id) as salesCount
      FROM customers c
      LEFT JOIN sales s ON s.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.last_name, c.first_name
    `);
    connection.release();
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

app.post('/api/customers', verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Nombre y apellido son requeridos' });
    }
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO customers (first_name, last_name, phone) VALUES (?, ?, ?)',
      [firstName, lastName, phone || null]
    );
    connection.release();
    res.status(201).json({ id: result.insertId, message: 'Cliente creado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

app.get('/api/customers/:id/sales', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [sales] = await connection.query(`
      SELECT s.id, s.sale_number, s.total_amount, s.payment_method, s.payment_status,
             s.discount_label, s.created_at
      FROM sales s
      WHERE s.customer_id = ?
      ORDER BY s.created_at DESC
    `, [req.params.id]);
    connection.release();
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener ventas del cliente' });
  }
});

app.put('/api/sales/:id/payment-status', verifyToken, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!['paid', 'pending'].includes(paymentStatus)) {
      return res.status(400).json({ error: 'paymentStatus debe ser "paid" o "pending"' });
    }
    const connection = await pool.getConnection();
    await connection.query('UPDATE sales SET payment_status = ? WHERE id = ?', [paymentStatus, req.params.id]);
    connection.release();
    res.json({ message: 'Estado de pago actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar estado de pago' });
  }
});


// =====================
// RUTAS DE PRODUCTOS
// =====================

app.get('/api/products', verifyToken, async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, stockStatus, isBulk } = req.query;
    
    let query = `
      SELECT p.id, p.name, p.sku, c.name as category, 
             COALESCE(v.total_stock, p.stock) as stock, 
             p.max_stock as maxStock, 
             COALESCE(v.min_variant_price, p.price) as price, 
             p.icon,
             p.is_bulk as isBulk, p.has_sizes as hasSizes,
             p.price_per_kg as pricePerKg, 
             COALESCE(b.batch_kg_stock, p.current_kg_stock) as currentKgStock, 
             p.initial_kg_stock as initialKgStock,
             p.bag_kg as bagKg,
             p.closed_bag_price as closedBagPrice,
             COALESCE(b.batch_count, 0) as batchCount,
             p.alert_threshold as alertThreshold,
             CASE 
               WHEN p.is_bulk = true AND COALESCE(b.batch_kg_stock, p.current_kg_stock) <= p.alert_threshold THEN 'low'
               WHEN p.has_sizes = true AND COALESCE(v.total_stock, 0) <= p.alert_threshold THEN 'low'
               WHEN p.is_bulk = false AND p.has_sizes = false AND p.stock <= p.alert_threshold THEN 'low'
               ELSE 'normal'
             END as stockStatus
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN (
        SELECT product_id, SUM(stock) as total_stock, MIN(price) as min_variant_price
        FROM product_variants 
        GROUP BY product_id
      ) v ON v.product_id = p.id
      LEFT JOIN (
        SELECT product_id, SUM(remaining_kg) as batch_kg_stock, COUNT(*) as batch_count
        FROM product_stock_batches
        GROUP BY product_id
      ) b ON b.product_id = p.id
      WHERE 1=1
    `;
    
    const params = [];

    if (q) {
      query += ` AND (p.name LIKE ? OR p.sku LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      query += ` AND c.name = ?`;
      params.push(category);
    }
    if (minPrice) {
      query += ` AND p.price >= ?`;
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ` AND p.price <= ?`;
      params.push(parseFloat(maxPrice));
    }
    if (stockStatus === 'low') {
      query += ` AND (
        (p.is_bulk = true AND COALESCE(b.batch_kg_stock, p.current_kg_stock) <= p.alert_threshold) OR
        (p.has_sizes = true AND COALESCE(v.total_stock, 0) <= p.alert_threshold) OR
        (p.is_bulk = false AND p.has_sizes = false AND p.stock <= p.alert_threshold)
      )`;
    }
    if (isBulk === 'true') {
      query += ` AND p.is_bulk = true`;
    } else if (isBulk === 'false') {
      query += ` AND p.is_bulk = false`;
    }

    query += ` ORDER BY p.name`;

    const connection = await pool.getConnection();
    const [products] = await connection.query(query, params);
    connection.release();
    
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});
app.get('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [products] = await connection.query(`
      SELECT p.id, p.name, p.sku, c.name as category, 
             p.stock, p.max_stock as maxStock, p.price, p.icon,
             p.is_bulk as isBulk, p.has_sizes as hasSizes, p.price_per_kg as pricePerKg, 
             p.initial_kg_stock as initialKgStock,
             p.current_kg_stock as currentKgStock,
             p.bag_kg as bagKg,
             p.closed_bag_price as closedBagPrice,
             p.alert_threshold as alertThreshold
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [req.params.id]);
    connection.release();
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(products[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

app.get('/api/products/:id/variants', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [variants] = await connection.query(
      'SELECT id, talle, stock, price, cost_price as costPrice, profit_percent as profitPercent FROM product_variants WHERE product_id = ? ORDER BY id',
      [req.params.id]
    );
    connection.release();
    res.json(variants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener talles' });
  }
});


app.put('/api/products/:id/variants', verifyToken, async (req, res) => {
  try {
    const { sizes } = req.body;
    if (!Array.isArray(sizes)) {
      return res.status(400).json({ error: 'sizes debe ser un array' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query('DELETE FROM product_variants WHERE product_id = ?', [req.params.id]);

      for (const s of sizes) {
        if (s.talle && s.talle.trim() !== '') {
          await connection.query(
            'INSERT INTO product_variants (product_id, talle, stock, price, cost_price, profit_percent) VALUES (?, ?, ?, ?, ?, ?)',
            [
              req.params.id,
              s.talle.trim(),
              parseInt(s.stock) || 0,
              s.price !== undefined && s.price !== '' && s.price !== null ? parseFloat(s.price) : null,
              s.costPrice !== undefined && s.costPrice !== '' && s.costPrice !== null ? parseFloat(s.costPrice) : null,
              s.profitPercent !== undefined && s.profitPercent !== '' && s.profitPercent !== null ? parseFloat(s.profitPercent) : null,
            ]
          );
        }
      }

      await connection.commit();
      res.json({ message: 'Talles actualizados' });

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar talles' });
  }
});


app.put('/api/products/:id', verifyToken, async (req, res) => {
  try {
const { name, sku, category, stock, maxStock, price, icon, isBulk, pricePerKg, initialKgStock, alertThreshold, hasSizes, sizes, bagKg, closedBagPrice, bags } = req.body;    
    const connection = await pool.getConnection();
    const [categories] = await connection.query('SELECT id FROM categories WHERE name = ?', [category]);
    if (categories.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'Categoría no existe' });
    }

    await connection.query(
      `UPDATE products SET name = ?, sku = ?, category_id = ?, stock = ?, max_stock = ?, 
                         price = ?, icon = ?, is_bulk = ?, price_per_kg = ?, current_kg_stock = ?, 
                         bag_kg = ?, closed_bag_price = ?, alert_threshold = ? 
       WHERE id = ?`,
      [name, sku, categories[0].id, stock, maxStock, price, icon, isBulk, pricePerKg, currentKgStock, 
       bagKg || null, closedBagPrice || null, alertThreshold, req.params.id]
    );
    connection.release();

    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

app.post('/api/products', verifyToken, async (req, res) => {
  try {
const { name, sku, category, stock, maxStock, price, icon, isBulk, pricePerKg, initialKgStock, alertThreshold, hasSizes, sizes, bagKg, closedBagPrice, bagQty } = req.body;
    if (!name || !sku || !category || (price === undefined || price === null)) {
      return res.status(400).json({ error: 'Campos requeridos: name, sku, category, price' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [categories] = await connection.query('SELECT id FROM categories WHERE name = ?', [category]);
      if (categories.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Categoría no existe' });
      }

      const [result] = await connection.query(
        `INSERT INTO products (name, sku, category_id, stock, max_stock, price, icon, 
                             is_bulk, has_sizes, price_per_kg, initial_kg_stock, current_kg_stock, 
                             bag_kg, closed_bag_price, alert_threshold) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, sku, categories[0].id, hasSizes ? 0 : (stock || 0), maxStock || 50, price, icon || 'nutrition', 
         isBulk || false, hasSizes || false, pricePerKg || null, initialKgStock || 0, initialKgStock || 0, 
         bagKg || null, closedBagPrice || null, alertThreshold || 2]
      );

      const productId = result.insertId;

      if (hasSizes && Array.isArray(sizes)) {
        for (const s of sizes) {
          if (s.talle && s.talle.trim() !== '') {
            await connection.query(
              'INSERT INTO product_variants (product_id, talle, stock, price, cost_price, profit_percent) VALUES (?, ?, ?, ?, ?, ?)',
              [
                productId,
                s.talle.trim(),
                parseInt(s.stock) || 0,
                s.price !== undefined && s.price !== '' && s.price !== null ? parseFloat(s.price) : null,
                s.costPrice !== undefined && s.costPrice !== '' && s.costPrice !== null ? parseFloat(s.costPrice) : null,
                s.profitPercent !== undefined && s.profitPercent !== '' && s.profitPercent !== null ? parseFloat(s.profitPercent) : null,
              ]
            );
          }
        }
      }

    if (isBulk && bagKg && Array.isArray(bags) && bags.length > 0) {
        for (const bag of bags) {
          const remaining = bag.remainingKg !== undefined && bag.remainingKg !== null
            ? parseFloat(bag.remainingKg)
            : bagKg;
          await connection.query(
            'INSERT INTO product_stock_batches (product_id, initial_kg, remaining_kg) VALUES (?, ?, ?)',
            [productId, bagKg, Math.max(0, Math.min(remaining, bagKg))]
          );
        }
      }
      await connection.commit();
      res.status(201).json({ id: productId, message: 'Producto creado' });

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El SKU ya existe, o hay talles repetidos' });
    }
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

app.delete('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    connection.release();
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

app.get('/api/products/:id/batches', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [batches] = await connection.query(
      'SELECT id, initial_kg as initialKg, remaining_kg as remainingKg FROM product_stock_batches WHERE product_id = ? ORDER BY id ASC',
      [req.params.id]
    );
    connection.release();
    res.json(batches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las bolsas' });
  }
});

app.post('/api/products/:id/batches', verifyToken, async (req, res) => {
  try {
    const { initialKg, quantity } = req.body;
    const kg = parseFloat(initialKg);
    const qty = parseInt(quantity) || 1;

    if (!kg || kg <= 0) {
      return res.status(400).json({ error: 'initialKg debe ser mayor a 0' });
    }

    const connection = await pool.getConnection();
    for (let i = 0; i < qty; i++) {
      await connection.query(
        'INSERT INTO product_stock_batches (product_id, initial_kg, remaining_kg) VALUES (?, ?, ?)',
        [req.params.id, kg, kg]
      );
    }
    connection.release();

    res.status(201).json({ message: `${qty} bolsa(s) agregada(s)` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar bolsas' });
  }
});

app.put('/api/products/:id/batches/:batchId', verifyToken, async (req, res) => {
  try {
    const { remainingKg } = req.body;
    if (remainingKg === undefined || remainingKg === null || isNaN(parseFloat(remainingKg))) {
      return res.status(400).json({ error: 'remainingKg requerido' });
    }
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE product_stock_batches SET remaining_kg = ? WHERE id = ? AND product_id = ?',
      [Math.max(0, parseFloat(remainingKg)), req.params.batchId, req.params.id]
    );
    connection.release();
    res.json({ message: 'Bolsa actualizada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la bolsa' });
  }
});

app.delete('/api/products/:id/batches/:batchId', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'DELETE FROM product_stock_batches WHERE id = ? AND product_id = ?',
      [req.params.batchId, req.params.id]
    );
    connection.release();
    res.json({ message: 'Bolsa eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la bolsa' });
  }
});

// =====================
// ACTUALIZACIÓN DE PRECIOS
// =====================

app.put('/api/products/:id/price', verifyToken, async (req, res) => {
  try {
    const { changeType, changeValue } = req.body;
    
    if (!changeType || !changeValue) {
      return res.status(400).json({ error: 'changeType y changeValue requeridos' });
    }

    const connection = await pool.getConnection();
    const [products] = await connection.query('SELECT price FROM products WHERE id = ?', [req.params.id]);
    if (products.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const oldPrice = parseFloat(products[0].price);
    let newPrice;

    if (changeType === 'fixed') {
      newPrice = oldPrice + parseFloat(changeValue);
    } else if (changeType === 'percent') {
      newPrice = oldPrice * (1 + parseFloat(changeValue) / 100);
    } else {
      connection.release();
      return res.status(400).json({ error: 'changeType debe ser "fixed" o "percent"' });
    }

    await connection.query('UPDATE products SET price = ? WHERE id = ?', [newPrice.toFixed(2), req.params.id]);

    await connection.query(
      `INSERT INTO price_history (product_id, old_price, new_price, change_type, change_value, changed_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.id, oldPrice, newPrice.toFixed(2), changeType, changeValue, req.userId]
    );

    connection.release();

    res.json({ 
      message: 'Precio actualizado',
      oldPrice: oldPrice,
      newPrice: parseFloat(newPrice.toFixed(2))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar precio' });
  }
});

// =====================
// RUTAS DE VENTAS
// =====================

async function generateSaleNumber(connection) {
  const year = new Date().getFullYear();
  const [rows] = await connection.query(`SELECT COUNT(*) as count FROM sales`);
  const count = rows[0].count + 1;
  return `VTA-${year}-${String(count).padStart(5, '0')}`;
}

async function createStockAlert(connection, productId, alertType, currentStock, alertThreshold) {
  await connection.query(
    `INSERT INTO stock_alerts (product_id, alert_type, current_stock, alert_threshold, alerted_at) 
     VALUES (?, ?, ?, ?, NOW())`,
    [productId, alertType, currentStock, alertThreshold]
  );
}

app.post('/api/sales', verifyToken, async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, installments, discountType, discountValue, customerId } = req.body;
    
    if (!items || items.length === 0 || !totalAmount) {
      return res.status(400).json({ error: 'items y totalAmount requeridos' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const saleNumber = await generateSaleNumber(connection);

      let discountLabel = '';
      if (discountType === 'percent') {
        if (paymentMethod === 'efectivo') {
          discountLabel = `Descuento Efectivo (${discountValue}%)`;
        } else if (paymentMethod === 'transferencia') {
          discountLabel = `Descuento Transf. (${discountValue}%)`;
        }
      } else if (discountType === 'fixed') {
        discountLabel = `Descuento (${discountValue} ARS)`;
      }
      
      if (paymentMethod === 'credito') {
        if (installments === 1) {
          discountLabel = `Cargo 1 Cuota (10%)`;
        } else {
          discountLabel = `Cargo ${installments} Cuotas (30%)`;
        }
      }

      const paymentStatus = paymentMethod === 'cuenta_corriente' ? 'pending' : 'paid';

      const [saleResult] = await connection.query(
        `INSERT INTO sales (sale_number, user_id, total_amount, payment_method, installments, 
                          discount_type, discount_value, discount_label, status, customer_id, payment_status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, NOW())`,
        [saleNumber, req.userId, totalAmount, paymentMethod || 'cash', installments || 1, 
         discountType || null, discountValue || 0, discountLabel, customerId || null, paymentStatus]
      );
      const saleId = saleResult.insertId;

      for (const item of items) {
        const [products] = await connection.query(
          'SELECT is_bulk, has_sizes, stock, current_kg_stock, alert_threshold FROM products WHERE id = ?',
          [item.productId]
        );

        if (products.length === 0) {
          throw new Error(`Producto ${item.productId} no encontrado`);
        }

        const product = products[0];
        const subtotal = item.quantity * item.price;

        await connection.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, kg_quantity, unit_price, subtotal, talle) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [saleId, item.productId, item.quantity || 0, item.kgQuantity || 0, item.price, subtotal, item.talle || null]
        );

        if (product.has_sizes) {
          if (!item.talle) {
            throw new Error(`Falta indicar el talle para el producto ${item.productId}`);
          }
          const [variants] = await connection.query(
            'SELECT stock FROM product_variants WHERE product_id = ? AND talle = ? FOR UPDATE',
            [item.productId, item.talle]
          );
          if (variants.length === 0) {
            throw new Error(`Talle ${item.talle} no encontrado para el producto ${item.productId}`);
          }
          const newStock = variants[0].stock - (item.quantity || 0);
          await connection.query(
            'UPDATE product_variants SET stock = ? WHERE product_id = ? AND talle = ?',
            [Math.max(0, newStock), item.productId, item.talle]
          );
          if (newStock <= product.alert_threshold) {
            await createStockAlert(connection, item.productId, 'low_stock', newStock, product.alert_threshold);
          }
        } else if (product.is_bulk) {
          const [batchCountRows] = await connection.query(
            'SELECT COUNT(*) as cnt FROM product_stock_batches WHERE product_id = ?',
            [item.productId]
          );
          const hasBatches = batchCountRows[0].cnt > 0;

          if (hasBatches) {
            if (item.saleType === 'bag') {
              const bagsNeeded = parseInt(item.bagQty) || 0;
              const [closedBatches] = await connection.query(
                'SELECT id, initial_kg FROM product_stock_batches WHERE product_id = ? AND remaining_kg = initial_kg ORDER BY id ASC LIMIT ? FOR UPDATE',
                [item.productId, bagsNeeded]
              );
              if (closedBatches.length < bagsNeeded) {
                throw new Error(`No hay suficientes bolsas cerradas disponibles para el producto ${item.productId}`);
              }
              for (const b of closedBatches) {
                await connection.query('UPDATE product_stock_batches SET remaining_kg = 0 WHERE id = ?', [b.id]);
              }
            } else {
              let kgNeeded = parseFloat(item.kgQuantity || 0);
              const [batches] = await connection.query(
                `SELECT id, initial_kg, remaining_kg FROM product_stock_batches 
                 WHERE product_id = ? AND remaining_kg > 0 
                 ORDER BY (remaining_kg < initial_kg) DESC, remaining_kg ASC 
                 FOR UPDATE`,
                [item.productId]
              );
              for (const b of batches) {
                if (kgNeeded <= 0) break;
                const avail = parseFloat(b.remaining_kg);
                const take = Math.min(avail, kgNeeded);
                await connection.query('UPDATE product_stock_batches SET remaining_kg = ? WHERE id = ?', [avail - take, b.id]);
                kgNeeded -= take;
              }
              if (kgNeeded > 0.0001) {
                throw new Error(`Stock insuficiente para el producto ${item.productId}`);
              }
            }

            const [[{ total: remainingTotal }]] = await connection.query(
              'SELECT COALESCE(SUM(remaining_kg),0) as total FROM product_stock_batches WHERE product_id = ?',
              [item.productId]
            );
            if (remainingTotal <= product.alert_threshold) {
              await createStockAlert(connection, item.productId, 'low_kg_stock', remainingTotal, product.alert_threshold);
            }
          } else {
            const newKgStock = parseFloat(product.current_kg_stock) - parseFloat(item.kgQuantity || 0);
            await connection.query(
              'UPDATE products SET current_kg_stock = ? WHERE id = ?',
              [Math.max(0, newKgStock), item.productId]
            );
            if (newKgStock <= product.alert_threshold) {
              await createStockAlert(connection, item.productId, 'low_kg_stock', newKgStock, product.alert_threshold);
            }
          }
        } else {
          const newStock = product.stock - (item.quantity || 0);
          await connection.query(
            'UPDATE products SET stock = ? WHERE id = ?',
            [Math.max(0, newStock), item.productId]
          );
          if (newStock <= product.alert_threshold) {
            await createStockAlert(connection, item.productId, 'low_stock', newStock, product.alert_threshold);
          }
        }
      }
      await connection.commit();

      res.status(201).json({
        saleNumber: saleNumber,
        saleId: saleId,
        createdAt: new Date().toISOString(),
        message: `Venta ${saleNumber} registrada correctamente`
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Error al crear venta' });
  }
});

app.get('/api/sales', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod, searchTerm } = req.query;

    let query = `
      SELECT s.id, s.sale_number, s.total_amount, s.payment_method, s.installments,
             s.discount_type, s.discount_value, s.discount_label,
             s.status, s.payment_status, s.customer_id,
             CASE WHEN c.id IS NOT NULL THEN CONCAT(c.first_name, ' ', c.last_name) ELSE NULL END as customer_name,
             s.created_at, u.full_name as user_name
      FROM sales s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;

    const params = [];

    if (startDate) {
      query += ` AND DATE(s.created_at) >= DATE(?)`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND DATE(s.created_at) <= DATE(?)`;
      params.push(endDate);
    }
    if (paymentMethod) {
      query += ` AND s.payment_method = ?`;
      params.push(paymentMethod);
    }
    if (searchTerm) {
      query += ` AND (s.sale_number LIKE ? OR u.full_name LIKE ?)`;
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    query += ` ORDER BY s.created_at DESC LIMIT 100`;

    const connection = await pool.getConnection();
    const [sales] = await connection.query(query, params);
    connection.release();

    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

app.get('/api/sales/:id', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [saleDetails] = await connection.query(`
      SELECT si.id, si.product_id, p.name as product_name, si.quantity, si.kg_quantity, 
             si.unit_price, si.subtotal, si.talle
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `, [req.params.id]);
    connection.release();

    res.json(saleDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener detalles de venta' });
  }
});

// =====================
// RUTAS DE ALERTAS DE STOCK
// =====================

app.get('/api/alerts', verifyToken, async (req, res) => {
  try {
    const { type, resolved } = req.query;

    let query = `
      SELECT sa.id, sa.product_id, p.name as product_name, sa.alert_type, 
             sa.current_stock, sa.alert_threshold, sa.alerted_at, sa.resolved_at
      FROM stock_alerts sa
      JOIN products p ON sa.product_id = p.id
      WHERE 1=1
    `;

    const params = [];

    if (type) {
      query += ` AND sa.alert_type = ?`;
      params.push(type);
    }
    if (resolved === 'false') {
      query += ` AND sa.resolved_at IS NULL`;
    }

    query += ` ORDER BY sa.alerted_at DESC`;

    const connection = await pool.getConnection();
    const [alerts] = await connection.query(query, params);
    connection.release();

    res.json(alerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
});

// =====================
// HISTORIAL DE PRECIOS
// =====================

app.get('/api/products/:id/price-history', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [history] = await connection.query(`
      SELECT ph.id, ph.old_price, ph.new_price, ph.change_type, ph.change_value, 
             u.full_name as changed_by, ph.changed_at
      FROM price_history ph
      JOIN users u ON ph.changed_by = u.id
      WHERE ph.product_id = ?
      ORDER BY ph.changed_at DESC
    `, [req.params.id]);
    connection.release();

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener historial de precios' });
  }
});

// =====================
// RUTA DE SALUD
// =====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend funcionando correctamente' });
});

// =====================
// ERROR 404
// =====================

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// =====================
// INICIAR SERVIDOR
// =====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});