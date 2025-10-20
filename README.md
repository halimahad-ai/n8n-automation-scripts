# n8n Automation Scripts - Beginner's Guide

Welcome to your automation scripts collection! This repository contains simple, practical Python scripts that showcase automation capabilities. Perfect for beginners learning to code!

## What's Inside?

This repository contains three automation scripts that demonstrate different programming concepts:

### 1. File Organizer (`file_organizer.py`)
**What it does:** Automatically sorts messy files into organized folders by type.

**Example:**
- Takes a folder with mixed files: `photo.jpg`, `report.pdf`, `song.mp3`
- Organizes them into: `Images/photo.jpg`, `Documents/report.pdf`, `Audio/song.mp3`

**What you'll learn:**
- Working with files and folders
- Using loops to process multiple items
- Organizing data into categories

**Try it:**
```bash
python file_organizer.py
```

---

### 2. Website Status Checker (`website_checker.py`)
**What it does:** Checks if websites are online and measures how fast they respond.

**Example:**
- Checks if google.com is accessible
- Tells you if it's fast (0.5s), normal (2s), or slow (5s)
- Shows error messages if a site is down

**What you'll learn:**
- Making HTTP requests (talking to websites)
- Error handling (dealing with problems gracefully)
- Measuring performance

**Try it:**
```bash
python website_checker.py
```

---

### 3. JSON Data Processor (`data_processor.py`)
**What it does:** Reads, filters, and analyzes JSON data (the format most APIs use).

**Example:**
- Reads a list of users from a JSON file
- Filters users by age, city, or other criteria
- Generates statistics (average age, most popular city, etc.)
- Saves filtered results to a new file

**What you'll learn:**
- Reading and writing JSON files
- Filtering and searching data
- Calculating statistics
- Working with dictionaries and lists

**Try it:**
```bash
python data_processor.py
```

---

## Getting Started

### Prerequisites
All you need is Python installed on your computer!

**Check if you have Python:**
```bash
python --version
```
or
```bash
python3 --version
```

**Don't have Python?** Download it from [python.org](https://www.python.org/downloads/)

### Running the Scripts

1. **Clone this repository** (download it to your computer):
   ```bash
   git clone <your-repo-url>
   cd n8n-automation-scripts
   ```

2. **Run any script:**
   ```bash
   python file_organizer.py
   python website_checker.py
   python data_processor.py
   ```

   *Note: Use `python3` instead of `python` if needed on your system*

---

## Understanding the Code

### Key Concepts Demonstrated

#### 1. **Functions** (Reusable Code Blocks)
```python
def check_website(url):
    # This function can be called multiple times with different URLs
    # It keeps our code organized and reusable
    return result
```

#### 2. **Loops** (Repeating Actions)
```python
for website in websites:
    # This runs the same code for each website in our list
    check_website(website)
```

#### 3. **Conditionals** (Making Decisions)
```python
if response_time < 1:
    print("Fast!")
else:
    print("Slow!")
```

#### 4. **Error Handling** (Dealing with Problems)
```python
try:
    # Try to do something
    open_website(url)
except Exception as e:
    # If something goes wrong, handle it gracefully
    print(f"Error: {e}")
```

#### 5. **Working with Files**
```python
# Reading a file
with open('data.json', 'r') as f:
    data = json.load(f)

# Writing a file
with open('output.json', 'w') as f:
    json.dump(data, f)
```

---

## Customization Ideas

### Modify the File Organizer
- Add new file categories (e.g., `'3D Models': ['.obj', '.fbx']`)
- Change where files are organized
- Add a scheduling feature to run daily

### Modify the Website Checker
- Add your own websites to monitor
- Set up email notifications when sites go down
- Log results to a file for historical tracking
- Add more detailed checks (SSL certificate expiry, etc.)

### Modify the Data Processor
- Process your own JSON data from APIs
- Add more filtering options
- Create different types of visualizations
- Export to CSV instead of JSON

---

## Next Steps - Level Up Your Automation!

### 1. **Combine Scripts**
Create a master script that runs all three at once!

### 2. **Add Scheduling**
Run scripts automatically using:
- **Linux/Mac:** `cron jobs`
- **Windows:** `Task Scheduler`
- **Python:** `schedule` library

### 3. **Add Notifications**
Send yourself messages when scripts complete:
- Email notifications
- Slack/Discord webhooks
- Desktop notifications

### 4. **Connect to Real APIs**
- Weather data (OpenWeatherMap)
- GitHub repositories
- Twitter feeds
- Stock prices

### 5. **Learn n8n**
These scripts show the building blocks of automation. [n8n](https://n8n.io/) lets you build these workflows visually without coding!

---

## Project Structure

```
n8n-automation-scripts/
├── README.md                 # This file!
├── file_organizer.py        # Organizes files by type
├── website_checker.py       # Checks if websites are online
├── data_processor.py        # Processes JSON data
├── sample_data.json         # Generated by data_processor.py
└── filtered_users.json      # Generated by data_processor.py
```

---

## Troubleshooting

**Problem:** `python: command not found`
**Solution:** Try `python3` instead, or install Python from python.org

**Problem:** `Permission denied`
**Solution:** On Linux/Mac, run: `chmod +x script_name.py`

**Problem:** Script runs but does nothing
**Solution:** Check the file paths in the script - you may need to customize them for your system

---

## Learning Resources

- **Python Basics:** [python.org/about/gettingstarted](https://www.python.org/about/gettingstarted/)
- **Automation Ideas:** [automatetheboringstuff.com](https://automatetheboringstuff.com/)
- **n8n Documentation:** [docs.n8n.io](https://docs.n8n.io/)

---

## Contributing

This is your learning repository! Feel free to:
- Modify the scripts
- Add new features
- Create new automation scripts
- Share your improvements

---

## What I Learned Making This

As Claude, an AI assistant, I created these scripts to showcase:

1. **Clear, readable code** - Using descriptive variable names and comments
2. **Error handling** - Scripts that don't crash when things go wrong
3. **User-friendly output** - Helpful messages and progress indicators
4. **Practical examples** - Real-world automation tasks
5. **Educational value** - Each script teaches different concepts

These scripts follow Python best practices and include detailed explanations so beginners can understand what's happening at each step.

---

## License

This is a learning project - use it however you want! Experiment, break things, and learn from it.

---

**Happy Automating!** 🚀

*Questions? Issues? That's part of learning! Try to debug them yourself first (it's the best way to learn), then search online, or ask for help.*
