#!/usr/bin/env python3
"""
Website Status Checker - Monitor if websites are online

This script checks if websites are accessible and measures their response time.
You can use it to monitor your favorite websites or your own web projects!

Perfect for: Checking if a website is down or just slow
"""

import urllib.request
import urllib.error
import time
from datetime import datetime

def check_website(url):
    """
    Check if a website is online and measure response time

    Args:
        url: The website URL to check (e.g., 'https://google.com')

    Returns:
        dict: Status information including response time and status code
    """
    # Make sure URL has http:// or https://
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    try:
        # Record start time
        start_time = time.time()

        # Try to open the website
        response = urllib.request.urlopen(url, timeout=10)

        # Calculate how long it took
        response_time = time.time() - start_time

        # Get status code (200 = OK, 404 = Not Found, etc.)
        status_code = response.getcode()

        return {
            'url': url,
            'status': 'Online ✅',
            'status_code': status_code,
            'response_time': round(response_time, 2),
            'error': None
        }

    except urllib.error.HTTPError as e:
        # Website responded but with an error (like 404, 500, etc.)
        return {
            'url': url,
            'status': 'Error ⚠️',
            'status_code': e.code,
            'response_time': None,
            'error': f'HTTP Error {e.code}'
        }

    except urllib.error.URLError as e:
        # Couldn't connect to website
        return {
            'url': url,
            'status': 'Offline ❌',
            'status_code': None,
            'response_time': None,
            'error': 'Cannot connect to server'
        }

    except Exception as e:
        # Something else went wrong
        return {
            'url': url,
            'status': 'Error ❌',
            'status_code': None,
            'response_time': None,
            'error': str(e)
        }

def monitor_websites(websites):
    """
    Check multiple websites and display their status

    Args:
        websites: List of website URLs to check
    """
    print("=" * 70)
    print(f"WEBSITE STATUS CHECKER - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    print()

    for url in websites:
        print(f"Checking: {url}...")
        result = check_website(url)

        print(f"  Status: {result['status']}")
        if result['status_code']:
            print(f"  Status Code: {result['status_code']}")
        if result['response_time']:
            print(f"  Response Time: {result['response_time']} seconds")
            # Give a speed rating
            if result['response_time'] < 1:
                print(f"  Speed: Fast 🚀")
            elif result['response_time'] < 3:
                print(f"  Speed: Normal ⚡")
            else:
                print(f"  Speed: Slow 🐌")
        if result['error']:
            print(f"  Error: {result['error']}")
        print("-" * 70)

    print("\n✨ Check complete!\n")

# Example usage
if __name__ == "__main__":
    # List of websites to check
    # You can add or remove websites from this list!
    websites_to_check = [
        'https://www.google.com',
        'https://www.github.com',
        'https://www.python.org',
        'https://www.example.com',
        # Add your own websites here:
        # 'https://your-website.com',
    ]

    print("\n👋 Welcome to Website Status Checker!")
    print("This script will check if websites are online and how fast they respond.\n")

    # Run the check
    monitor_websites(websites_to_check)

    print("💡 TIP: You can edit this file to check your own websites!")
    print("   Just add them to the 'websites_to_check' list above.\n")
    print("💡 TIP: Run this script regularly with cron (Linux/Mac) or Task Scheduler (Windows)")
    print("   to get automated monitoring!\n")
