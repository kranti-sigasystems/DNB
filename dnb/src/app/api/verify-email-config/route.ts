import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    
    // Check environment variables
    const requiredEnvVars = {
      SMTP_HOST: process.env.SMTP_HOST,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        missingVars,
        type: 'config_error'
      }, { status: 500 });
    }


    // Test transporter creation
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });


      // Verify connection
      const verified = await transporter.verify();

      return NextResponse.json({
        success: true,
        message: 'Email configuration is valid',
        config: {
          service: 'gmail',
          user: process.env.EMAIL_USER,
          host: process.env.SMTP_HOST,
        },
        verified: true,
        type: 'config_check'
      });

    } catch (transportError) {
      console.error('❌ Transporter error:', transportError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create or verify email transporter',
        details: transportError instanceof Error ? transportError.message : 'Unknown transport error',
        type: 'transport_error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Email config verification error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'verification_error'
    }, { status: 500 });
  }
}