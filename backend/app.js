const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const rfpRouter = require('./routes/rfpRoutes');
const vendorRouter = require('./routes/vendors');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '3mb' }));

app.use('/api/rfp', rfpRouter);
app.use('/api/vendors', vendorRouter);

app.get('/', (req, res) => res.send('AI RFP backend running'));
module.exports = app;
