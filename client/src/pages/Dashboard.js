import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";
const COLUMNS = ["Applied", "Interview", "Offer", "Rejected"];
const BADGE_COLORS = {
  Applied: "bg-blue-500",
  Interview: "bg-yellow-500",
  Offer: "bg-green-500",
  Rejected: "bg-red-500",
};

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [form, setForm] = useState({
    company: "",
    role: "",
    status: "Applied",
    notes: "",
    jobLink: "",
    deadline: "",
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();
  const name = localStorage.getItem("name");
  const token = localStorage.getItem("token");
  const headers = { Authorization: "Bearer " + token };

  const fetchJobs = async () => {
    try {
      const res = await axios.get(API + "/jobs", { headers });
      setJobs(res.data);
    } catch (err) {
      logout();
    } finally {
      setPageLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(API + "/jobs/stats", { headers });
      setStats(res.data);
    } catch (err) {}
  };

  // eslint-disable-next-line
  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const openAdd = () => {
    setEditJob(null);
    setForm({ company: "", role: "", status: "Applied", notes: "", jobLink: "", deadline: "" });
    setShowModal(true);
  };

  const openEdit = (job) => {
    setEditJob(job);
    setForm({
      company: job.company,
      role: job.role,
      status: job.status,
      notes: job.notes || "",
      jobLink: job.jobLink || "",
      deadline: job.deadline ? job.deadline.slice(0, 10) : "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editJob) {
        await axios.patch(API + "/jobs/" + editJob._id, form, { headers });
      } else {
        await axios.post(API + "/jobs", form, { headers });
      }
      setShowModal(false);
      fetchJobs();
      fetchStats();
      toast.success(editJob ? "Job updated! ✅" : "Job added! 🎉");
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job?")) return;
    try {
      await axios.delete(API + "/jobs/" + id, { headers });
      fetchJobs();
      fetchStats();
      toast.success("Job deleted! 🗑️");
    } catch (err) {}
  };

  const handleStatusChange = async (job, newStatus) => {
    try {
      await axios.patch(API + "/jobs/" + job._id, { status: newStatus }, { headers });
      fetchJobs();
      fetchStats();
      toast.success("Status updated! 🔄");
    } catch (err) {}
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const filteredJobs = (col) =>
    jobs.filter(
      (j) =>
        j.status === col &&
        j.company.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)" }}>
      {pageLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"}}>
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg font-semibold">Loading JobPilot...</p>
          </div>
        </div>
      )}
      {/* Navbar */}
      <nav className="bg-white bg-opacity-10 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-white border-opacity-20">
        <h1 className="text-2xl font-bold text-white">JobPilot</h1>
        <div className="flex items-center gap-4">
          <span className="text-white font-medium">Hi, {name}!</span>
          <button
            onClick={openAdd}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            + Add Job
          </button>
          <button
            onClick={logout}
            className="text-white hover:text-red-300 transition font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Search Bar */}
      <div className="px-6 pt-4">
        <input
          type="text"
          placeholder="🔍 Search by company name..."
          className="w-full bg-white bg-opacity-20 backdrop-blur-md border border-white border-opacity-30 rounded-2xl px-5 py-3 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 lg:grid-cols-2 lg:grid-cols-2 lg:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col} className="bg-white bg-opacity-20 backdrop-blur-md rounded-2xl p-5 text-center border border-white border-opacity-30 hover:bg-opacity-30 transition-all duration-300 cursor-default">
            <p className="text-4xl font-bold text-white">{stats[col] || 0}</p>
            <p className="text-sm text-purple-100 mt-1 font-medium">{col}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 lg:grid-cols-2 lg:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col} className="rounded-2xl border border-white border-opacity-30 p-4 bg-white bg-opacity-10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className={"w-3 h-3 rounded-full " + BADGE_COLORS[col]}></span>
              <h2 className="font-bold text-white">{col}</h2>
              <span className="ml-auto bg-white text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                {filteredJobs(col).length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredJobs(col).map((job) => (
                <div
                  key={job._id}
                  className={"bg-white bg-opacity-90 rounded-2xl p-4 shadow-lg border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 " + (isOverdue(job.deadline) ? "border-red-400" : "border-white")}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-800 text-sm">{job.company}</h3>
                    {isOverdue(job.deadline) && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{job.role}</p>
                  {job.notes && (
                    <p className="text-xs text-gray-400 mb-2 italic">"{job.notes}"</p>
                  )}
                  {job.deadline && (
                    <p className="text-xs text-gray-400 mb-2">
                      📅 {new Date(job.deadline).toLocaleDateString()}
                    </p>
                  )}
                  {job.jobLink && (
                    <p className="text-xs text-purple-500 mb-2">
                      <a href={job.jobLink} target="_blank" rel="noreferrer">🔗 View Job</a>
                    </p>
                  )}

                  <select
                    value={job.status}
                    onChange={(e) => handleStatusChange(job, e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 mb-2 focus:outline-none"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(job)}
                      className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 py-1 rounded-lg transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(job._id)}
                      className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-500 py-1 rounded-lg transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {filteredJobs(col).length === 0 && (
                <p className="text-center text-purple-200 text-xs py-8">
                  {search ? "No results found 🔍" : "No jobs here"}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editJob ? "Edit Job" : "Add New Job"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Company name"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Job role"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
              />
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {COLUMNS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Job link (optional)"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={form.jobLink}
                onChange={(e) => setForm({ ...form, jobLink: e.target.value })}
              />
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
              <textarea
                placeholder="Notes (optional)"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : editJob ? "Update" : "Add Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-6 mt-4">
        <div className="text-white text-sm">
          Built with <span className="text-red-400"></span> by{" "}
          <span className="font-semibold text-white">Ashu Kr Thakur</span>
        </div>
        <div className="text-purple-200 text-xs mt-1">
          © 2026 JobPilot — Track smarter, apply faster
        </div>
      </footer>
    </div>
  );
}