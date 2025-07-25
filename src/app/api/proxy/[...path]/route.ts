import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const environment = searchParams.get('environment') || 'test';
    
    // Determine the base URL based on environment
    const baseUrl = environment === 'test' 
      ? 'https://bluboy.ddns.net/test1'
      : 'https://bluboy.ddns.net/prod1';
    
    // Reconstruct the API path
    const resolvedParams = await params;
    const apiPath = resolvedParams.path.join('/');
    const url = `${baseUrl}/api/v1/${apiPath}`;
    
    // Get headers from the original request
    const authToken = request.headers.get('authorization');
    const appKey = request.headers.get('app-key');
    const clientTime = request.headers.get('client-time');
    const notificationPermission = request.headers.get('notification-permission-status');
    const userAgent = request.headers.get('user-agent');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authorization header is required' }, 
        { status: 401 }
      );
    }

    // Make the request to the external API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Authorization': authToken,
        'Connection': 'keep-alive',
        'NOTIFICATION-PERMISSION-STATUS': notificationPermission || 'true',
        'User-Agent': userAgent || 'TambolaMultiPlayerApp/1.0.0',
        'app-key': appKey || 'test-key',
        'client-time': clientTime || Math.floor(Date.now() / 1000).toString()
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        { 
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorText
        }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// Support other HTTP methods if needed
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const environment = searchParams.get('environment') || 'test';
    
    const baseUrl = environment === 'test' 
      ? 'https://bluboy.ddns.net/test1'
      : 'https://bluboy.ddns.net/prod1';
    
    const resolvedParams = await params;
    const apiPath = resolvedParams.path.join('/');
    const url = `${baseUrl}/api/v1/${apiPath}`;
    
    const authToken = request.headers.get('authorization');
    const appKey = request.headers.get('app-key');
    const clientTime = request.headers.get('client-time');
    const notificationPermission = request.headers.get('notification-permission-status');
    const userAgent = request.headers.get('user-agent');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authorization header is required' }, 
        { status: 401 }
      );
    }

    const body = await request.text();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Authorization': authToken,
        'Connection': 'keep-alive',
        'NOTIFICATION-PERMISSION-STATUS': notificationPermission || 'true',
        'User-Agent': userAgent || 'TambolaMultiPlayerApp/1.0.0',
        'app-key': appKey || 'test-key',
        'client-time': clientTime || Math.floor(Date.now() / 1000).toString(),
        'Content-Type': request.headers.get('content-type') || 'application/json'
      },
      body: body || undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        { 
          error: `API request failed: ${response.status} ${response.statusText}`,
          details: errorText
        }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 