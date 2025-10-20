#!/usr/bin/env python3
"""
JSON Data Processor - Work with JSON data like a pro

This script demonstrates how to:
- Read JSON data
- Filter and search through it
- Analyze and generate reports
- Export processed data

Perfect for: Processing API responses, configuration files, or any JSON data
"""

import json
from datetime import datetime
from pathlib import Path

# Sample data - imagine this came from an API or database
SAMPLE_DATA = {
    "users": [
        {"id": 1, "name": "Alice", "age": 28, "city": "New York", "active": True},
        {"id": 2, "name": "Bob", "age": 35, "city": "London", "active": True},
        {"id": 3, "name": "Charlie", "age": 22, "city": "Tokyo", "active": False},
        {"id": 4, "name": "Diana", "age": 31, "city": "New York", "active": True},
        {"id": 5, "name": "Eve", "age": 27, "city": "Paris", "active": True},
    ],
    "metadata": {
        "generated_at": datetime.now().isoformat(),
        "total_count": 5
    }
}

def save_sample_data():
    """Create a sample JSON file to work with"""
    sample_file = Path("sample_data.json")
    with open(sample_file, 'w') as f:
        json.dump(SAMPLE_DATA, f, indent=2)
    print(f"✅ Created sample data file: {sample_file}")
    return sample_file

def read_json_file(filename):
    """
    Read and parse a JSON file

    Args:
        filename: Path to the JSON file

    Returns:
        dict: Parsed JSON data
    """
    try:
        with open(filename, 'r') as f:
            data = json.load(f)
        print(f"✅ Successfully read {filename}")
        return data
    except FileNotFoundError:
        print(f"❌ Error: File '{filename}' not found!")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in file - {e}")
        return None

def filter_users(users, **criteria):
    """
    Filter users based on criteria

    Args:
        users: List of user dictionaries
        **criteria: Keyword arguments for filtering (e.g., city="New York")

    Returns:
        list: Filtered users
    """
    filtered = users

    for key, value in criteria.items():
        if key in ['city', 'name']:
            # Text fields - exact match
            filtered = [u for u in filtered if u.get(key) == value]
        elif key == 'active':
            # Boolean field
            filtered = [u for u in filtered if u.get(key) == value]
        elif key == 'min_age':
            # Numeric comparison
            filtered = [u for u in filtered if u.get('age', 0) >= value]
        elif key == 'max_age':
            filtered = [u for u in filtered if u.get('age', 0) <= value]

    return filtered

def generate_report(users):
    """
    Generate a statistical report from user data

    Args:
        users: List of user dictionaries

    Returns:
        dict: Report with statistics
    """
    if not users:
        return {"error": "No users to analyze"}

    # Calculate statistics
    ages = [u['age'] for u in users]
    cities = [u['city'] for u in users]
    active_count = sum(1 for u in users if u.get('active', False))

    # Count users per city
    city_counts = {}
    for city in cities:
        city_counts[city] = city_counts.get(city, 0) + 1

    report = {
        "total_users": len(users),
        "active_users": active_count,
        "inactive_users": len(users) - active_count,
        "age_stats": {
            "average": round(sum(ages) / len(ages), 1),
            "youngest": min(ages),
            "oldest": max(ages)
        },
        "cities": city_counts,
        "most_popular_city": max(city_counts, key=city_counts.get)
    }

    return report

def display_report(report):
    """Pretty print a report"""
    print("\n" + "=" * 60)
    print("📊 DATA ANALYSIS REPORT")
    print("=" * 60)

    if "error" in report:
        print(f"❌ {report['error']}")
        return

    print(f"\n👥 Total Users: {report['total_users']}")
    print(f"   ✅ Active: {report['active_users']}")
    print(f"   ⭕ Inactive: {report['inactive_users']}")

    print(f"\n📈 Age Statistics:")
    print(f"   Average: {report['age_stats']['average']} years")
    print(f"   Youngest: {report['age_stats']['youngest']} years")
    print(f"   Oldest: {report['age_stats']['oldest']} years")

    print(f"\n🌍 Users by City:")
    for city, count in report['cities'].items():
        bar = "█" * count
        print(f"   {city:15} {bar} ({count})")

    print(f"\n⭐ Most Popular City: {report['most_popular_city']}")
    print("=" * 60 + "\n")

def save_filtered_data(data, filename):
    """Save processed data to a new JSON file"""
    output_file = Path(filename)
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"💾 Saved results to: {output_file}")

# Example usage
if __name__ == "__main__":
    print("🚀 JSON Data Processor - Demo\n")

    # Step 1: Create sample data
    print("Step 1: Creating sample data...")
    sample_file = save_sample_data()
    print()

    # Step 2: Read the data
    print("Step 2: Reading JSON file...")
    data = read_json_file(sample_file)
    if not data:
        exit(1)
    print()

    # Step 3: Analyze all data
    print("Step 3: Analyzing all users...")
    all_users_report = generate_report(data['users'])
    display_report(all_users_report)

    # Step 4: Filter data (example: users from New York)
    print("Step 4: Filtering users from New York...")
    ny_users = filter_users(data['users'], city="New York")
    print(f"Found {len(ny_users)} users in New York:")
    for user in ny_users:
        print(f"  - {user['name']} (Age: {user['age']})")
    print()

    # Step 5: Filter by age
    print("Step 5: Filtering users aged 25-30...")
    young_users = filter_users(data['users'], min_age=25, max_age=30)
    print(f"Found {len(young_users)} users aged 25-30:")
    for user in young_users:
        print(f"  - {user['name']} (Age: {user['age']}, City: {user['city']})")
    print()

    # Step 6: Save filtered results
    print("Step 6: Saving filtered results...")
    filtered_data = {
        "filtered_users": young_users,
        "filter_criteria": "Age between 25 and 30",
        "count": len(young_users),
        "processed_at": datetime.now().isoformat()
    }
    save_filtered_data(filtered_data, "filtered_users.json")
    print()

    print("✨ Demo complete!")
    print("\n💡 TIP: Edit this script to work with your own JSON data!")
    print("💡 TIP: This is useful for processing API responses, logs, or config files!\n")
