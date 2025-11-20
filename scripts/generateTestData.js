const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const Vehicle = require('../src/models/Vehicle');
const Order = require('../src/models/Order');
const Shipment = require('../src/models/Shipment');
const Route = require('../src/models/Route');
const Inventory = require('../src/models/Inventory');
const Attendance = require('../src/models/Attendance');

const firstNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anita', 'Rajesh', 'Pooja', 'Sanjay', 'Meera'];
const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Reddy', 'Verma', 'Joshi', 'Nair', 'Mehta'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];
const companies = ['Tech Corp', 'Global Traders', 'Express Logistics', 'Prime Distributors', 'Swift Transport'];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);

async function generateTestData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🧹 Clearing existing test data...');
    await User.deleteMany({ email: /@test\.com$/ });
    await Customer.deleteMany({});
    await Vehicle.deleteMany({});
    await Order.deleteMany({});
    await Shipment.deleteMany({});
    await Route.deleteMany({});
    await Inventory.deleteMany({});
    await Attendance.deleteMany({});
    console.log('✅ Existing data cleared\n');

    const generatedIds = { users: [], customers: [], vehicles: [], orders: [] };

    console.log('👥 Generating users...');
    const users = [];
    
    // Create fixed test users first
    const fixedUsers = [
      { name: 'Admin User', email: 'admin@test.com', password: 'Test@123', role: 'admin', phone: '+919876543210' },
      { name: 'Manager User', email: 'manager@test.com', password: 'Test@123', role: 'manager', phone: '+919876543211' },
      { name: 'Driver User', email: 'driver@test.com', password: 'Test@123', role: 'driver', phone: '+919876543212' },
      { name: 'Staff User', email: 'staff@test.com', password: 'Test@123', role: 'staff', phone: '+919876543213' }
    ];

    console.log('Creating fixed test users...');
    for (const userData of fixedUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
      console.log(`  ✓ ${userData.email} (${userData.role})`);
    }

    // Create random users
    console.log('Creating random test users...');
    const roles = ['admin', 'manager', 'driver', 'staff'];
    for (let i = 0; i < 16; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const user = new User({
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@test.com`,
        password: 'Test@123',
        phone: `+91${getRandomInt(6000000000, 9999999999)}`,
        role: getRandomElement(roles),
        isActive: true
      });
      await user.save();
      users.push(user);
    }

    generatedIds.users = users.map(u => u._id);
    console.log(`✅ Created ${users.length} users (4 fixed + 16 random)\n`);

    console.log('🏢 Generating customers...');
    const customers = [];

    for (let i = 0; i < 30; i++) {
      const company = getRandomElement(companies);
      customers.push({
        customerId: `CUST${String(i + 1).padStart(5, '0')}`,
        name: `${company} ${i}`,
        email: `contact${i}@${company.toLowerCase().replace(' ', '')}.test.com`,
        phone: `+91${getRandomInt(6000000000, 9999999999)}`,
        company: company,
        address: {
          street: `${getRandomInt(1, 999)} MG Road`,
          city: getRandomElement(cities),
          state: 'Maharashtra',
          zipCode: `${getRandomInt(400000, 600000)}`,
          country: 'India'
        },
        contactPerson: {
          name: `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`,
          phone: `+91${getRandomInt(6000000000, 9999999999)}`,
          email: `person${i}@test.com`
        }
      });
    }

    const savedCustomers = await Customer.insertMany(customers);
    generatedIds.customers = savedCustomers.map(c => c._id);
    console.log(`✅ Created ${savedCustomers.length} customers\n`);

    console.log('🚚 Generating vehicles...');
    const vehicles = [];
    const vehicleTypes = ['Truck', 'Van', 'Pickup'];
    const makes = ['Tata', 'Ashok Leyland', 'Mahindra', 'Eicher'];

    for (let i = 0; i < 15; i++) {
      vehicles.push({
        vehicleNumber: `MH02AB${1000 + i}`,
        registrationNumber: `MH02AB${1000 + i}`,
        type: getRandomElement(vehicleTypes),
        make: getRandomElement(makes),
        model: 'LPT 1613',
        year: getRandomInt(2018, 2024),
        capacity: getRandomInt(1000, 5000),
        status: getRandomElement(['available', 'in-transit', 'maintenance']),
        driver: getRandomElement(generatedIds.users),
        location: {
          type: 'Point',
          coordinates: [parseFloat(getRandomFloat(72.8, 77.6)), parseFloat(getRandomFloat(18.5, 28.7))]
        }
      });
    }

    const savedVehicles = await Vehicle.insertMany(vehicles);
    generatedIds.vehicles = savedVehicles.map(v => v._id);
    console.log(`✅ Created ${savedVehicles.length} vehicles\n`);

    console.log('📦 Generating orders...');
    const orders = [];
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    for (let i = 0; i < 50; i++) {
      const itemCount = getRandomInt(1, 5);
      const items = [];
      let totalAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const quantity = getRandomInt(10, 100);
        const unitPrice = parseFloat(getRandomFloat(100, 1000));
        const total = quantity * unitPrice;
        totalAmount += total;

        items.push({
          name: `Product ${j + 1}`,
          quantity,
          unitPrice,
          totalPrice: total
        });
      }

      const finalAmount = totalAmount;
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - getRandomInt(0, 30));

      orders.push({
        orderNumber: `ORD${String(i + 1).padStart(5, '0')}`,
        customer: getRandomElement(generatedIds.customers),
        items,
        totalAmount,
        finalAmount,
        status: getRandomElement(statuses),
        orderDate,
        shippingAddress: {
          street: `${getRandomInt(1, 999)} Shipping Lane`,
          city: getRandomElement(cities),
          state: 'Maharashtra',
          zipCode: `${getRandomInt(400000, 600000)}`
        },
        createdBy: getRandomElement(generatedIds.users)
      });
    }

    const savedOrders = await Order.insertMany(orders);
    generatedIds.orders = savedOrders.map(o => o._id);
    console.log(`✅ Created ${savedOrders.length} orders\n`);

    console.log('📮 Generating shipments...');
    const shipments = [];
    const shipmentStatuses = ['pending', 'in-transit', 'delivered'];

    for (let i = 0; i < 30; i++) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + getRandomInt(1, 7));
      
      const estimatedDate = new Date(scheduledDate);
      estimatedDate.setDate(estimatedDate.getDate() + getRandomInt(2, 5));

      shipments.push({
        shipmentNumber: `SHIP${String(i + 1).padStart(6, '0')}`,
        trackingNumber: `TRACK${String(i + 1).padStart(8, '0')}`,
        order: getRandomElement(generatedIds.orders),
        customer: getRandomElement(generatedIds.customers),
        vehicle: getRandomElement(generatedIds.vehicles),
        driver: getRandomElement(generatedIds.users),
        status: getRandomElement(shipmentStatuses),
        totalWeight: parseFloat(getRandomFloat(100, 2000)),
        scheduledPickupDate: scheduledDate,
        estimatedDeliveryDate: estimatedDate,
        origin: {
          address: `${getRandomInt(1, 999)} Origin St`,
          city: getRandomElement(cities),
          coordinates: [parseFloat(getRandomFloat(72.8, 77.6)), parseFloat(getRandomFloat(18.5, 28.7))]
        },
        destination: {
          address: `${getRandomInt(1, 999)} Dest Ave`,
          city: getRandomElement(cities),
          coordinates: [parseFloat(getRandomFloat(72.8, 77.6)), parseFloat(getRandomFloat(18.5, 28.7))]
        }
      });
    }

    const savedShipments = await Shipment.insertMany(shipments);
    console.log(`✅ Created ${savedShipments.length} shipments\n`);

    console.log('📊 Generating inventory...');
    const inventory = [];
    const categories = ['Electronics', 'Furniture', 'Clothing', 'Food', 'Hardware', 'Accessories'];
    const units = ['pcs', 'kg', 'ltr', 'box', 'carton', 'pallet'];

    for (let i = 0; i < 25; i++) {
      const costPrice = parseFloat(getRandomFloat(100, 1000));
      const sellingPrice = parseFloat((costPrice * (1 + getRandomFloat(0.2, 0.5))).toFixed(2));

      inventory.push({
        itemCode: `ITEM${String(i + 1).padStart(6, '0')}`,
        name: `Product ${i + 1}`,
        sku: `SKU${String(i + 1).padStart(5, '0')}`,
        category: getRandomElement(categories),
        quantity: getRandomInt(50, 500),
        unit: getRandomElement(units),
        costPrice: costPrice,
        sellingPrice: sellingPrice,
        reorderLevel: getRandomInt(10, 50),
        maxStockLevel: getRandomInt(600, 1000),
        location: {
          warehouse: 'Main Warehouse',
          zone: `Zone ${String.fromCharCode(65 + getRandomInt(0, 5))}`,
          shelf: `S${getRandomInt(1, 20)}`,
          bin: `B${getRandomInt(1, 50)}`
        },
        weight: parseFloat(getRandomFloat(0.5, 50)),
        supplier: {
          name: getRandomElement(companies),
          contactPerson: `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`,
          phone: `+91${getRandomInt(6000000000, 9999999999)}`,
          email: `supplier${i}@test.com`
        },
        isActive: true,
        createdBy: getRandomElement(generatedIds.users)
      });
    }

    const savedInventory = await Inventory.insertMany(inventory);
    console.log(`✅ Created ${savedInventory.length} inventory items\n`);

    console.log('📅 Generating attendance records...');
    const attendance = [];
    const today = new Date();
    const attendanceStatuses = ['present', 'absent', 'half-day', 'late', 'on-leave'];
    const leaveTypes = ['sick-leave', 'casual-leave', 'paid-leave'];

    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0); // Set to start of day

      for (const userId of generatedIds.users.slice(0, 10)) {
        const status = getRandomElement(attendanceStatuses);
        
        if (status === 'present' || status === 'half-day' || status === 'late') {
          const checkInHour = status === 'late' ? getRandomInt(10, 12) : getRandomInt(8, 10);
          const checkInMinute = getRandomInt(0, 59);
          const checkInTime = new Date(date);
          checkInTime.setHours(checkInHour, checkInMinute, 0, 0);
          
          const workHours = status === 'half-day' ? getRandomInt(4, 5) : getRandomInt(8, 10);
          const checkOutTime = new Date(checkInTime);
          checkOutTime.setHours(checkInTime.getHours() + workHours, getRandomInt(0, 59), 0, 0);

          attendance.push({
            employee: userId,
            date,
            checkIn: {
              time: checkInTime,
              location: {
                type: 'Point',
                coordinates: [parseFloat(getRandomFloat(72.8, 77.6)), parseFloat(getRandomFloat(18.5, 28.7))],
                address: `${getRandomInt(1, 999)} Office St, ${getRandomElement(cities)}`
              },
              device: getRandomElement(['Mobile', 'Web', 'Biometric']),
              ipAddress: `192.168.${getRandomInt(1, 255)}.${getRandomInt(1, 255)}`
            },
            checkOut: {
              time: checkOutTime,
              location: {
                type: 'Point',
                coordinates: [parseFloat(getRandomFloat(72.8, 77.6)), parseFloat(getRandomFloat(18.5, 28.7))],
                address: `${getRandomInt(1, 999)} Office St, ${getRandomElement(cities)}`
              },
              device: getRandomElement(['Mobile', 'Web', 'Biometric']),
              ipAddress: `192.168.${getRandomInt(1, 255)}.${getRandomInt(1, 255)}`
            },
            status: status,
            isApproved: true,
            approvedBy: getRandomElement(generatedIds.users)
          });
        } else if (status === 'on-leave') {
          // For on-leave, we need checkIn.time but no checkOut
          const checkInTime = new Date(date);
          checkInTime.setHours(0, 0, 0, 0);
          
          attendance.push({
            employee: userId,
            date,
            checkIn: {
              time: checkInTime,
              location: {
                type: 'Point',
                coordinates: [0, 0]
              }
            },
            status: status,
            leaveType: getRandomElement(leaveTypes),
            isApproved: true,
            approvedBy: getRandomElement(generatedIds.users),
            notes: 'Leave approved'
          });
        } else {
          // For absent
          const checkInTime = new Date(date);
          checkInTime.setHours(0, 0, 0, 0);
          
          attendance.push({
            employee: userId,
            date,
            checkIn: {
              time: checkInTime,
              location: {
                type: 'Point',
                coordinates: [0, 0]
              }
            },
            status: status,
            isApproved: false,
            notes: 'Marked absent'
          });
        }
      }
    }

    const savedAttendance = await Attendance.insertMany(attendance);
    console.log(`✅ Created ${savedAttendance.length} attendance records\n`);

    console.log('╔═══════════════════════════════════════════╗');
    console.log('║     ✅ TEST DATA GENERATION COMPLETE     ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log(`   • Users: ${users.length}`);
    console.log(`   • Customers: ${savedCustomers.length}`);
    console.log(`   • Vehicles: ${savedVehicles.length}`);
    console.log(`   • Orders: ${savedOrders.length}`);
    console.log(`   • Shipments: ${savedShipments.length}`);
    console.log(`   • Inventory: ${savedInventory.length}`);
    console.log(`   • Attendance: ${savedAttendance.length}`);
    console.log(`   • TOTAL: ${users.length + savedCustomers.length + savedVehicles.length + savedOrders.length + savedShipments.length + savedInventory.length + savedAttendance.length} records\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

generateTestData();