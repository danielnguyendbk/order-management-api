const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dns = require('dns');
require('dotenv').config();
const app = express();

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;
const MONGO_DNS_SERVERS = process.env.MONGO_DNS_SERVERS || '8.8.8.8,1.1.1.1';

const dnsServers = MONGO_DNS_SERVERS
	.split(',')
	.map(server => server.trim())
	.filter(Boolean);

if (dnsServers.length > 0) {
	dns.setServers(dnsServers);
}

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json()); // Cho phep server doc JSON tu request body


const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

async function startServer() {
	if (!MONGO_URI) {
		console.error('❌ Missing MONGO_URI.');
		process.exit(1);
	}

	try {
		// Fail fast neu khong tim thay server MongoDB sau 10s.
		await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
		console.log('✅ MongoDB Connected!');

		app.listen(PORT, () => {
			console.log(`🚀 Server is running on port ${PORT}`);
		});
	} catch (err) {
		console.error('❌ Connection error:', err.message);
		process.exit(1);
	}
}

// Route kiem tra server
app.get('/', (req, res) => {
	res.json({
		success: true,
		message: 'API Quan ly Don hang dang hoat dong...',
		data: null
	});
});

// Khoi chay server sau khi ket noi DB thanh cong
startServer();