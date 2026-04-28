export interface StaffMember {
  id: string;
  name: string;
  role: 'Manager' | 'Associate' | 'Specialist' | 'Cashier';
  department: string;
  email: string;
  phone: string;
  hireDate: string;
}

export interface ShiftEntry {
  employeeId: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  shift: 'morning' | 'afternoon' | 'evening' | 'off';
  startTime: string;
  endTime: string;
}

export const staff: StaffMember[] = [
  { id: 'EMP01', name: 'Mike Sullivan', role: 'Manager', department: 'Store Operations', email: 'msullivan@ace-naperville.com', phone: '(630) 555-0101', hireDate: '2015-03-12' },
  { id: 'EMP02', name: 'Sarah Lin', role: 'Specialist', department: 'Paint', email: 'slin@ace-naperville.com', phone: '(630) 555-0102', hireDate: '2018-06-20' },
  { id: 'EMP03', name: 'Tom Brady', role: 'Associate', department: 'Tools', email: 'tbrady@ace-naperville.com', phone: '(630) 555-0103', hireDate: '2020-01-15' },
  { id: 'EMP04', name: 'Jessica Reyes', role: 'Cashier', department: 'Front End', email: 'jreyes@ace-naperville.com', phone: '(630) 555-0104', hireDate: '2021-08-03' },
  { id: 'EMP05', name: 'Dave Patterson', role: 'Specialist', department: 'Plumbing', email: 'dpatterson@ace-naperville.com', phone: '(630) 555-0105', hireDate: '2017-11-28' },
  { id: 'EMP06', name: 'Kim Huang', role: 'Associate', department: 'Electrical', email: 'khuang@ace-naperville.com', phone: '(630) 555-0106', hireDate: '2019-04-10' },
  { id: 'EMP07', name: 'Carlos Mendez', role: 'Specialist', department: 'Outdoor & Garden', email: 'cmendez@ace-naperville.com', phone: '(630) 555-0107', hireDate: '2016-09-05' },
  { id: 'EMP08', name: 'Amy Johnson', role: 'Cashier', department: 'Front End', email: 'ajohnson@ace-naperville.com', phone: '(630) 555-0108', hireDate: '2022-02-14' },
  { id: 'EMP09', name: 'Robert Chen', role: 'Associate', department: 'Hardware', email: 'rchen@ace-naperville.com', phone: '(630) 555-0109', hireDate: '2020-07-22' },
  { id: 'EMP10', name: 'Lisa Marie Torres', role: 'Manager', department: 'Store Operations', email: 'ltorres@ace-naperville.com', phone: '(630) 555-0110', hireDate: '2014-05-18' },
  { id: 'EMP11', name: 'James O\'Brien', role: 'Associate', department: 'Paint', email: 'jobrien@ace-naperville.com', phone: '(630) 555-0111', hireDate: '2021-03-30' },
  { id: 'EMP12', name: 'Maria Garcia', role: 'Specialist', department: 'Tools', email: 'mgarcia@ace-naperville.com', phone: '(630) 555-0112', hireDate: '2018-10-08' },
  { id: 'EMP13', name: 'Kevin Wright', role: 'Cashier', department: 'Front End', email: 'kwright@ace-naperville.com', phone: '(630) 555-0113', hireDate: '2023-01-09' },
  { id: 'EMP14', name: 'Nicole Peters', role: 'Associate', department: 'Seasonal', email: 'npeters@ace-naperville.com', phone: '(630) 555-0114', hireDate: '2022-06-15' },
  { id: 'EMP15', name: 'Derek Washington', role: 'Specialist', department: 'Plumbing', email: 'dwashington@ace-naperville.com', phone: '(630) 555-0115', hireDate: '2019-12-01' },
];

export const weeklySchedule: ShiftEntry[] = [
  // Mike Sullivan — Manager, mostly mornings
  { employeeId: 'EMP01', day: 'Mon', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP01', day: 'Tue', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP01', day: 'Wed', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP01', day: 'Thu', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP01', day: 'Fri', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP01', day: 'Sat', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP01', day: 'Sun', shift: 'off', startTime: '', endTime: '' },
  // Sarah Lin — Paint Specialist
  { employeeId: 'EMP02', day: 'Mon', shift: 'morning', startTime: '8:00 AM', endTime: '4:00 PM' },
  { employeeId: 'EMP02', day: 'Tue', shift: 'morning', startTime: '8:00 AM', endTime: '4:00 PM' },
  { employeeId: 'EMP02', day: 'Wed', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP02', day: 'Thu', shift: 'morning', startTime: '8:00 AM', endTime: '4:00 PM' },
  { employeeId: 'EMP02', day: 'Fri', shift: 'morning', startTime: '8:00 AM', endTime: '4:00 PM' },
  { employeeId: 'EMP02', day: 'Sat', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP02', day: 'Sun', shift: 'off', startTime: '', endTime: '' },
  // Tom Brady — Tools Associate
  { employeeId: 'EMP03', day: 'Mon', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP03', day: 'Tue', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP03', day: 'Wed', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP03', day: 'Thu', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP03', day: 'Fri', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP03', day: 'Sat', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP03', day: 'Sun', shift: 'off', startTime: '', endTime: '' },
  // Jessica Reyes — Cashier
  { employeeId: 'EMP04', day: 'Mon', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP04', day: 'Tue', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP04', day: 'Wed', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP04', day: 'Thu', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP04', day: 'Fri', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP04', day: 'Sat', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP04', day: 'Sun', shift: 'morning', startTime: '8:00 AM', endTime: '4:00 PM' },
  // Dave Patterson — Plumbing Specialist
  { employeeId: 'EMP05', day: 'Mon', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP05', day: 'Tue', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP05', day: 'Wed', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP05', day: 'Thu', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP05', day: 'Fri', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP05', day: 'Sat', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP05', day: 'Sun', shift: 'off', startTime: '', endTime: '' },
  // Kim Huang — Electrical Associate
  { employeeId: 'EMP06', day: 'Mon', shift: 'afternoon', startTime: '1:00 PM', endTime: '9:00 PM' },
  { employeeId: 'EMP06', day: 'Tue', shift: 'afternoon', startTime: '1:00 PM', endTime: '9:00 PM' },
  { employeeId: 'EMP06', day: 'Wed', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP06', day: 'Thu', shift: 'afternoon', startTime: '1:00 PM', endTime: '9:00 PM' },
  { employeeId: 'EMP06', day: 'Fri', shift: 'afternoon', startTime: '1:00 PM', endTime: '9:00 PM' },
  { employeeId: 'EMP06', day: 'Sat', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP06', day: 'Sun', shift: 'morning', startTime: '8:00 AM', endTime: '4:00 PM' },
  // Carlos Mendez — Outdoor Specialist
  { employeeId: 'EMP07', day: 'Mon', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP07', day: 'Tue', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP07', day: 'Wed', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP07', day: 'Thu', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP07', day: 'Fri', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP07', day: 'Sat', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP07', day: 'Sun', shift: 'off', startTime: '', endTime: '' },
  // Amy Johnson — Cashier
  { employeeId: 'EMP08', day: 'Mon', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP08', day: 'Tue', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP08', day: 'Wed', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP08', day: 'Thu', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP08', day: 'Fri', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP08', day: 'Sat', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP08', day: 'Sun', shift: 'morning', startTime: '8:00 AM', endTime: '4:00 PM' },
  // Robert Chen — Hardware Associate
  { employeeId: 'EMP09', day: 'Mon', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP09', day: 'Tue', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP09', day: 'Wed', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP09', day: 'Thu', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP09', day: 'Fri', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP09', day: 'Sat', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP09', day: 'Sun', shift: 'morning', startTime: '8:00 AM', endTime: '4:00 PM' },
  // Lisa Marie Torres — Manager
  { employeeId: 'EMP10', day: 'Mon', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP10', day: 'Tue', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP10', day: 'Wed', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP10', day: 'Thu', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP10', day: 'Fri', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP10', day: 'Sat', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP10', day: 'Sun', shift: 'off', startTime: '', endTime: '' },
  // James O'Brien — Paint Associate
  { employeeId: 'EMP11', day: 'Mon', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP11', day: 'Tue', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP11', day: 'Wed', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP11', day: 'Thu', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP11', day: 'Fri', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP11', day: 'Sat', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP11', day: 'Sun', shift: 'morning', startTime: '8:00 AM', endTime: '4:00 PM' },
  // Maria Garcia — Tools Specialist
  { employeeId: 'EMP12', day: 'Mon', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP12', day: 'Tue', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP12', day: 'Wed', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP12', day: 'Thu', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP12', day: 'Fri', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP12', day: 'Sat', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP12', day: 'Sun', shift: 'morning', startTime: '8:00 AM', endTime: '4:00 PM' },
  // Kevin Wright — Cashier
  { employeeId: 'EMP13', day: 'Mon', shift: 'evening', startTime: '3:00 PM', endTime: '9:00 PM' },
  { employeeId: 'EMP13', day: 'Tue', shift: 'evening', startTime: '3:00 PM', endTime: '9:00 PM' },
  { employeeId: 'EMP13', day: 'Wed', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP13', day: 'Thu', shift: 'evening', startTime: '3:00 PM', endTime: '9:00 PM' },
  { employeeId: 'EMP13', day: 'Fri', shift: 'evening', startTime: '3:00 PM', endTime: '9:00 PM' },
  { employeeId: 'EMP13', day: 'Sat', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP13', day: 'Sun', shift: 'off', startTime: '', endTime: '' },
  // Nicole Peters — Seasonal Associate
  { employeeId: 'EMP14', day: 'Mon', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP14', day: 'Tue', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP14', day: 'Wed', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP14', day: 'Thu', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP14', day: 'Fri', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP14', day: 'Sat', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP14', day: 'Sun', shift: 'morning', startTime: '8:00 AM', endTime: '4:00 PM' },
  // Derek Washington — Plumbing Specialist
  { employeeId: 'EMP15', day: 'Mon', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP15', day: 'Tue', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP15', day: 'Wed', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP15', day: 'Thu', shift: 'morning', startTime: '7:00 AM', endTime: '3:00 PM' },
  { employeeId: 'EMP15', day: 'Fri', shift: 'afternoon', startTime: '12:00 PM', endTime: '8:00 PM' },
  { employeeId: 'EMP15', day: 'Sat', shift: 'off', startTime: '', endTime: '' },
  { employeeId: 'EMP15', day: 'Sun', shift: 'off', startTime: '', endTime: '' },
];

// Today's on-duty staff (6 members — based on a typical weekday morning)
export const todayOnDuty = [
  { ...staff[0], currentShift: 'morning', shiftTime: '7:00 AM - 3:00 PM' },  // Mike Sullivan - Manager
  { ...staff[1], currentShift: 'morning', shiftTime: '8:00 AM - 4:00 PM' },  // Sarah Lin - Paint Specialist
  { ...staff[4], currentShift: 'morning', shiftTime: '7:00 AM - 3:00 PM' },  // Dave Patterson - Plumbing Specialist
  { ...staff[6], currentShift: 'morning', shiftTime: '7:00 AM - 3:00 PM' },  // Carlos Mendez - Outdoor Specialist
  { ...staff[11], currentShift: 'morning', shiftTime: '7:00 AM - 3:00 PM' }, // Maria Garcia - Tools Specialist
  { ...staff[3], currentShift: 'morning', shiftTime: '7:00 AM - 3:00 PM' },  // Jessica Reyes - Cashier
];

// Count open shifts this week (shifts that have nobody scheduled)
export const openShiftsThisWeek = 3;
