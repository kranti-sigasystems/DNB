import { NextRequest, NextResponse } from "next/server";
import { checkUniqueField } from "@/actions/business-owner";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Handle both query parameter formats
    const paramsString = searchParams.get("params");
    let field: string | null = null;
    let value: string | null = null;

    if (paramsString) {
      // Parse params[field]=value format
      const match = paramsString.match(/\[(\w+)\]=(.*)/);
      if (match) {
        field = match[1];
        value = decodeURIComponent(match[2]);
      }
    } else {
      // Direct query parameters
      field = searchParams.get("field");
      value = searchParams.get("value");
    }

    if (!field || !value) {
      return NextResponse.json(
        { success: false, message: "Field and value are required" },
        { status: 400 }
      );
    }

    const result = await checkUniqueField(field, value);

    return NextResponse.json({
      success: true,
      data: { [field]: result.exists },
      message: result.message,
    });

  } catch (error) {
    console.error("Check unique field API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}