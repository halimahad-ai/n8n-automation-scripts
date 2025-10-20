#!/usr/bin/env python3
"""
File Organizer - Automatically organize files into folders by type

This script scans a directory and moves files into organized folders
based on their file extensions (e.g., .pdf -> Documents, .jpg -> Images)

Perfect for: Organizing messy Downloads folders!
"""

import os
import shutil
from pathlib import Path

# Define which file types go into which folders
FILE_CATEGORIES = {
    'Images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
    'Documents': ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.xlsx', '.xls', '.csv'],
    'Videos': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
    'Audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'],
    'Archives': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
    'Code': ['.py', '.js', '.html', '.css', '.java', '.cpp', '.c', '.json', '.xml'],
}

def organize_files(source_directory):
    """
    Organize files in the given directory into categorized folders

    Args:
        source_directory: Path to the folder you want to organize
    """
    # Convert to Path object for easier handling
    source_path = Path(source_directory)

    # Check if directory exists
    if not source_path.exists():
        print(f"❌ Error: Directory '{source_directory}' not found!")
        return

    print(f"📂 Organizing files in: {source_path}")
    print("-" * 50)

    files_moved = 0

    # Loop through all files in the directory
    for item in source_path.iterdir():
        # Skip if it's a directory
        if item.is_dir():
            continue

        # Get the file extension (e.g., '.jpg')
        file_extension = item.suffix.lower()

        # Find which category this file belongs to
        category_found = False
        for category, extensions in FILE_CATEGORIES.items():
            if file_extension in extensions:
                # Create the category folder if it doesn't exist
                category_folder = source_path / category
                category_folder.mkdir(exist_ok=True)

                # Move the file
                destination = category_folder / item.name

                # Handle duplicate filenames
                counter = 1
                while destination.exists():
                    # Add a number to the filename: file(1).txt, file(2).txt, etc.
                    destination = category_folder / f"{item.stem}({counter}){item.suffix}"
                    counter += 1

                shutil.move(str(item), str(destination))
                print(f"✅ Moved: {item.name} → {category}/")
                files_moved += 1
                category_found = True
                break

        # If no category found, move to 'Others' folder
        if not category_found and file_extension:
            others_folder = source_path / 'Others'
            others_folder.mkdir(exist_ok=True)
            destination = others_folder / item.name
            shutil.move(str(item), str(destination))
            print(f"📄 Moved: {item.name} → Others/")
            files_moved += 1

    print("-" * 50)
    print(f"🎉 Done! Organized {files_moved} files.")

# Example usage
if __name__ == "__main__":
    # You can change this to any folder you want to organize
    # For example: "/Users/yourname/Downloads" or "C:\\Users\\yourname\\Downloads"

    # For demo purposes, we'll create a test folder
    test_folder = Path.home() / "test_organize"
    test_folder.mkdir(exist_ok=True)

    print("=" * 50)
    print("FILE ORGANIZER - Demo Mode")
    print("=" * 50)
    print("\nTo use this script:")
    print("1. Change 'test_folder' to your actual folder path")
    print("2. Run: python file_organizer.py")
    print(f"\nDemo folder created at: {test_folder}")
    print("Add some files there and run this script again!")
    print("=" * 50)
