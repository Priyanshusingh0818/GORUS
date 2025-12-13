const express = require('express');
const router = express.Router();

module.exports = function (db) {
  const getAllProducts = db.prepare('SELECT * FROM products ORDER BY created_at DESC');
  const getProductById = db.prepare('SELECT * FROM products WHERE id = ?');
  const createProduct = db.prepare(
    'INSERT INTO products (name, description, price, unit, image, available, tag, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const updateProduct = db.prepare(
    'UPDATE products SET name = ?, description = ?, price = ?, unit = ?, image = ?, available = ?, tag = ?, stock = ? WHERE id = ?'
  );
  const deleteProduct = db.prepare('DELETE FROM products WHERE id = ?');

  // GET all products
  router.get('/', (req, res) => {
    try {
      const products = getAllProducts.all();
      return res.json({ products });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // GET product by id
  router.get('/:id', (req, res) => {
    try {
      const product = getProductById.get(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.json({ product });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // POST create product (admin only)
  router.post('/', (req, res) => {
    try {
      const { name, description, price, unit, image, available, tag, stock } = req.body;
      if (!name || !price || !unit) {
        return res.status(400).json({ message: 'Name, price, and unit are required' });
      }
      const info = createProduct.run(
        name,
        description || null,
        price,
        unit,
        image || null,
        available ? 1 : 0,
        tag || null,
        stock || 100
      );
      const product = getProductById.get(info.lastInsertRowid);
      return res.status(201).json({ product });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // PUT update product (admin only)
  router.put('/:id', (req, res) => {
    try {
      const { name, description, price, unit, image, available, tag, stock } = req.body;
      const productId = req.params.id;
      
      if (!name || !price || !unit) {
        return res.status(400).json({ message: 'Name, price, and unit are required' });
      }

      updateProduct.run(
        name,
        description || null,
        price,
        unit,
        image || null,
        available ? 1 : 0,
        tag || null,
        stock || 100,
        productId
      );

      const product = getProductById.get(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.json({ product });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // DELETE product (admin only)
  router.delete('/:id', (req, res) => {
    try {
      const productId = req.params.id;
      const product = getProductById.get(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      deleteProduct.run(productId);
      return res.json({ message: 'Product deleted successfully' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};

