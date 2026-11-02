/**
 * Manual Class Creator Utility
 * 
 * Usage from terminal:
 *   node addClassManual.js "<Class Name>" "<Department>" <Year> "<Division>"
 * 
 * Example:
 *   node addClassManual.js "TY-CSE-A" "Computer Engineering" 3 "A"
 */

const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const Class = require('./models/Class');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Connected to MongoDB]');

    const args = process.argv.slice(2);

    if (args.length >= 4) {
      const [name, department, year, division] = args;
      
      const existing = await Class.findOne({ name: name.trim() });
      if (existing) {
        console.log(`[Notice] Class "${name}" already exists with ID: ${existing._id}`);
        await mongoose.connection.close();
        process.exit(0);
      }

      const newClass = await Class.create({
        name: name.trim(),
        department: department.trim(),
        year: Number(year),
        division: division.trim().toUpperCase()
      });

      console.log(`[Success] Created Class: "${newClass.name}" (ID: ${newClass._id})`);
    } else {
      console.log('\n================ MANUAL CLASS CREATION ================');
      console.log('Provide arguments:');
      console.log('  node addClassManual.js "<Class Name>" "<Department>" <Year> "<Division>"');
      console.log('\nExample:');
      console.log('  node addClassManual.js "TY-CSE-A" "Computer Engineering" 3 "A"');
      console.log('========================================================\n');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('[Error]:', err.message);
    process.exit(1);
  }
};

run();
