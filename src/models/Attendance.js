const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  checkIn: {
    time: { type: Date, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
      address: String
    },
    device: String,
    ipAddress: String
  },
  checkOut: {
    time: Date,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
      address: String
    },
    device: String,
    ipAddress: String
  },
  totalHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late', 'on-leave', 'holiday'],
    default: 'present'
  },
  leaveType: {
    type: String,
    enum: ['sick-leave', 'casual-leave', 'paid-leave', 'unpaid-leave', 'maternity', 'paternity'],
    sparse: true
  },
  breaks: [{
    startTime: Date,
    endTime: Date,
    duration: Number,
    type: { type: String, enum: ['lunch', 'tea', 'other'], default: 'other' }
  }],
  totalBreakTime: {
    type: Number,
    default: 0
  },
  workDescription: String,
  notes: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

attendanceSchema.pre('save', function(next) {
  if (this.checkIn.time && this.checkOut.time) {
    const diffMs = this.checkOut.time - this.checkIn.time;
    const diffHours = diffMs / (1000 * 60 * 60);
    this.totalHours = parseFloat(diffHours.toFixed(2));
    if (this.totalHours > 8) {
      this.overtimeHours = parseFloat((this.totalHours - 8).toFixed(2));
    }
  }
  next();
});

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ 'checkIn.location': '2dsphere' });
attendanceSchema.index({ 'checkOut.location': '2dsphere' });

module.exports = mongoose.model('Attendance', attendanceSchema);
