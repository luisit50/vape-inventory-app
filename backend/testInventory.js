const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bottle = require('./models/Bottle');

dotenv.config();

async function testInventory() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Get all bottles
    const bottles = await Bottle.find().limit(20);
    
    console.log('📦 Sample bottles from database:\n');
    bottles.forEach((bottle, i) => {
      console.log(`${i + 1}. Name: "${bottle.name}"`);
      console.log(`   MG: "${bottle.mg}"`);
      console.log(`   Size: "${bottle.bottleSize}"`);
      console.log(`   Brand: "${bottle.brand}"`);
      console.log('');
    });

    // Get counts
    const counts = await Bottle.aggregate([
      {
        $group: {
          _id: {
            name: '$name',
            mg: '$mg',
            bottleSize: '$bottleSize'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Inventory counts:\n');
    counts.forEach(item => {
      console.log(`"${item._id.name}" | ${item._id.mg}mg | ${item._id.bottleSize}ml → ${item.count} bottles`);
    });

    console.log(`\n✅ Total unique products: ${counts.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

testInventory();
