// import { NextResponse } from 'next/server';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import { connectDB } from '@/lib/db';
// import User from '@/models/User';

// // Register new user
// export async function POST(request) {
//   try {
//     const { username, email, password } = await request.json();

//     // Validation
//     if (!username || !email || !password) {
//       return NextResponse.json(
//         { error: 'All fields are required' },
//         { status: 400 }
//       );
//     }

//     if (password.length < 6) {
//       return NextResponse.json(
//         { error: 'Password must be at least 6 characters' },
//         { status: 400 }
//       );
//     }

//     await connectDB();

//     // Check if user already exists
//     const existingUser = await User.findOne({
//       $or: [{ email }, { username }]
//     });

//     if (existingUser) {
//       return NextResponse.json(
//         { error: 'User already exists with this email or username' },
//         { status: 400 }
//       );
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 12);

//     // Create user
//     const user = new User({
//       username,
//       email,
//       password: hashedPassword,
//     });

//     await user.save();

//     // Generate JWT token
//     const token = jwt.sign(
//       { userId: user._id, username: user.username },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     // Return user data without password
//     const { password: _, ...userWithoutPassword } = user.toObject();

//     return NextResponse.json({
//       message: 'User created successfully',
//       user: userWithoutPassword,
//       token
//     }, { status: 201 });

//   } catch (error) {
//     console.error('Registration error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // Login user
// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const email = searchParams.get('email');
//     const password = searchParams.get('password');

//     if (!email || !password) {
//       return NextResponse.json(
//         { error: 'Email and password are required' },
//         { status: 400 }
//       );
//     }

//     await connectDB();

//     // Find user
//     const user = await User.findOne({ email });
//     if (!user) {
//       return NextResponse.json(
//         { error: 'Invalid credentials' },
//         { status: 401 }
//       );
//     }

//     // Check password
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return NextResponse.json(
//         { error: 'Invalid credentials' },
//         { status: 401 }
//       );
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { userId: user._id, username: user.username },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     // Return user data without password
//     const { password: _, ...userWithoutPassword } = user.toObject();

//     return NextResponse.json({
//       message: 'Login successful',
//       user: userWithoutPassword,
//       token
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }