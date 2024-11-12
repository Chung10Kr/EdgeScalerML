import numpy as np
import matplotlib.pyplot as plt

# Original data for time schedules with minute and request count
timeSchedules = [
    { "min": "01", "count": 291 },
    { "min": "02", "count": 191 },
    { "min": "03", "count": 141 },
    { "min": "04", "count": 151 },
    { "min": "05", "count": 311 },
    { "min": "06", "count": 780 },
    { "min": "07", "count": 1239 },
    { "min": "08", "count": 1926 },
    { "min": "09", "count": 1907 },
    { "min": "10", "count": 1573 },
    { "min": "11", "count": 1433 },
    { "min": "12", "count": 1489 },
    { "min": "13", "count": 1449 },
    { "min": "14", "count": 1470 },
    { "min": "15", "count": 1469 },
    { "min": "16", "count": 1593 },
    { "min": "17", "count": 1757 },
    { "min": "18", "count": 1932 },
    { "min": "19", "count": 1652 },
    { "min": "20", "count": 1299 },
    { "min": "21", "count": 992 },
    { "min": "22", "count": 862 },
    { "min": "23", "count": 659 },
    { "min": "24", "count": 411 }
]

# Convert the list to a numpy array for easier manipulation
counts = np.array([schedule["count"] for schedule in timeSchedules])

# Find the smallest count to normalize the data
min_count = counts.min()

# Normalize the counts by dividing by the smallest count
normalized_counts = counts / min_count

# Plot the original and normalized data
minutes = range(1, len(counts) + 1)

plt.figure(figsize=(10, 5))

# Original data plot
plt.subplot(1, 2, 1)
plt.plot(minutes, counts, marker='o', label="Original Count")
plt.title("Original Request Counts")
plt.xlabel("Minute")
plt.ylabel("Request Count")
plt.xticks(minutes)
plt.legend()

# Normalized data plot
plt.subplot(1, 2, 2)
plt.plot(minutes, normalized_counts, marker='o', color="orange", label="Normalized Count")
plt.title("Normalized Request Counts")
plt.xlabel("Minute")
plt.ylabel("Normalized Request Count")
plt.xticks(minutes)
plt.legend()

plt.tight_layout()
plt.show()