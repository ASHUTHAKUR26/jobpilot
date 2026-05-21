const express = require("express");
const Job = require("../models/Job");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes below are protected — user must be logged in

// @route   GET /api/jobs
// @desc    Get all jobs for logged-in user
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const jobs = await Job.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/jobs
// @desc    Add a new job application
// @access  Private
router.post("/", protect, async (req, res) => {
  const { company, role, status, appliedDate, deadline, notes, jobLink } =
    req.body;

  try {
    if (!company || !role) {
      return res
        .status(400)
        .json({ message: "Company and role are required" });
    }

    const job = await Job.create({
      user: req.user._id,
      company,
      role,
      status: status || "Applied",
      appliedDate: appliedDate || Date.now(),
      deadline: deadline || null,
      notes: notes || "",
      jobLink: jobLink || "",
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PATCH /api/jobs/:id
// @desc    Update a job (status, notes, etc.)
// @access  Private
router.patch("/:id", protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Make sure the job belongs to the logged-in user
    if (job.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job application
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Make sure the job belongs to the logged-in user
    if (job.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await job.deleteOne();
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/jobs/stats
// @desc    Get stats for logged-in user (counts per status)
// @access  Private
router.get("/stats", protect, async (req, res) => {
  try {
    const stats = await Job.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Format: { Applied: 5, Interview: 2, Offer: 1, Rejected: 3 }
    const formatted = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0 };
    stats.forEach((s) => {
      formatted[s._id] = s.count;
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
