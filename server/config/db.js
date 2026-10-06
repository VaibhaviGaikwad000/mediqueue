const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); // Atlas SRV DNS error fix

const mongoose = require('mongoose');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('MongoDB connected:', mongoose.connection.host);
};

module.exports = connectDB;
module.exports.connectDB = connectDB;