const express = require('express');
const router = express.Router();

module.exports = function (pool, options = {}) {
  const allowWrites = options.allowWrites === true;

  // GET all products with storefront filters
  router.get('/', async (req, res) => {
    const {
      search,
      tag,
      unit,
      available,
      minPrice,
      maxPrice,
      sort = 'latest',
      limit
    } = req.query;

    const where = [];
    const values = [];

    const addValue = (value) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (search) {
      const token = addValue(`%${String(search).trim()}%`);
      where.push(`(name ILIKE ${token} OR description ILIKE ${token})`);
    }

    if (tag) {
      where.push(`LOWER(tag) = LOWER(${addValue(tag)})`);
    }

    if (unit) {
      where.push(`unit = ${addValue(unit)}`);
    }

    if (available === '1' || available === 'true') {
      where.push('available = 1');
    } else if (available === '0' || available === 'false') {
      where.push('available <> 1');
    }

    const min = Number(minPrice);
    if (Number.isFinite(min) && min >= 0) {
      where.push(`price >= ${addValue(min)}`);
    }

    const max = Number(maxPrice);
    if (Number.isFinite(max) && max >= 0) {
      where.push(`price <= ${addValue(max)}`);
    }

    const orderBy = {
      latest: 'created_at DESC',
      price_asc: 'price ASC',
      price_desc: 'price DESC',
      name_asc: 'name ASC',
      stock_desc: 'stock DESC'
    }[sort] || 'created_at DESC';

    const clauses = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limitValue = Number(limit);
    const limitClause = Number.isInteger(limitValue) && limitValue > 0 && limitValue <= 50
      ? ` LIMIT ${addValue(limitValue)}`
      : '';

    const { rows } = await pool.query(
      `SELECT * FROM products ${clauses} ORDER BY ${orderBy}${limitClause}`,
      values
    );

    const [{ rows: tagRows }, { rows: unitRows }, { rows: priceRows }] = await Promise.all([
      pool.query('SELECT DISTINCT tag FROM products WHERE tag IS NOT NULL AND tag <> $1 ORDER BY tag', ['']),
      pool.query('SELECT DISTINCT unit FROM products WHERE unit IS NOT NULL AND unit <> $1 ORDER BY unit', ['']),
      pool.query('SELECT MIN(price) AS min_price, MAX(price) AS max_price FROM products')
    ]);

    return res.json({
      products: rows,
      filters: {
        tags: tagRows.map(row => row.tag),
        units: unitRows.map(row => row.unit),
        priceRange: {
          min: Number(priceRows[0]?.min_price || 0),
          max: Number(priceRows[0]?.max_price || 0)
        }
      }
    });
  });


  // GET product by id
  router.get('/:id', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    const product = rows[0];
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json({ product });
  });

  if (!allowWrites) {
    return router;
  }

  // POST create product (admin only)
  router.post('/', async (req, res) => {
    const { name, description, price, unit, image, available, tag, stock } = req.body;
    const numericPrice = Number(price);
    const numericStock = Number.isInteger(Number(stock)) ? Number(stock) : 100;

    if (!name || !unit || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: 'Name, valid price, and unit are required' });
    }
    if (numericStock < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    const { rows } = await pool.query(
      'INSERT INTO products (name, description, price, unit, image, available, tag, stock) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name.trim(), description || null, numericPrice, unit.trim(), image || null, available ? 1 : 0, tag || null, numericStock]
    );
    return res.status(201).json({ product: rows[0] });
  });

  // PUT update product (admin only)
  router.put('/:id', async (req, res) => {
    const { name, description, price, unit, image, available, tag, stock } = req.body;
    const productId = req.params.id;
    const numericPrice = Number(price);
    const numericStock = Number.isInteger(Number(stock)) ? Number(stock) : 100;
    
    if (!name || !unit || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: 'Name, valid price, and unit are required' });
    }
    if (numericStock < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    const { rowCount } = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, unit = $4, image = $5, available = $6, tag = $7, stock = $8 WHERE id = $9',
      [name.trim(), description || null, numericPrice, unit.trim(), image || null, available ? 1 : 0, tag || null, numericStock, productId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    return res.json({ product: rows[0] });
  });

  // DELETE product (admin only)
  router.delete('/:id', async (req, res) => {
    const productId = req.params.id;
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [productId]);
    
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json({ message: 'Product deleted successfully' });
  });

  return router;
};

