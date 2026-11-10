import { useCallback, useEffect, useMemo, useState } from 'react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/students')
  .replace(/\/+$/, '');

const emptyStudent = {
  firstName: '',
  lastName: '',
  email: '',
  grade: '',
  course: '',
  dateOfBirth: ''
};

async function request(path = '', options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error('Could not reach the API. Check that the backend is running and try again.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));
}

function initials(student) {
  return `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase();
}

function StudentDialog({ student, onClose, onSave, saving }) {
  const [form, setForm] = useState(() => {
    if (!student) return emptyStudent;
    return {
      ...emptyStudent,
      ...student,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : ''
    };
  });
  const [formError, setFormError] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setFormError('');
    try {
      await onSave(form);
    } catch (error) {
      setFormError(error.message);
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="dialog"
        role="dialog"
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">{student ? 'STUDENT RECORD' : 'NEW ENROLLMENT'}</p>
            <h2 id="dialog-title">{student ? 'Edit student' : 'Add a student'}</h2>
          </div>
          <button
            aria-label="Close dialog"
            className="icon-button"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="student-form" onSubmit={submit}>
          <div className="form-grid">
            <label>
              First name
              <input autoComplete="given-name" maxLength="80" name="firstName" onChange={updateField} required value={form.firstName} />
            </label>
            <label>
              Last name
              <input autoComplete="family-name" maxLength="80" name="lastName" onChange={updateField} required value={form.lastName} />
            </label>
            <label className="form-span">
              Email address
              <input autoComplete="email" maxLength="254" name="email" onChange={updateField} required type="email" value={form.email} />
            </label>
            <label>
              Grade
              <input maxLength="40" name="grade" onChange={updateField} placeholder="e.g. 10th grade" required value={form.grade} />
            </label>
            <label>
              Course
              <input maxLength="120" name="course" onChange={updateField} placeholder="e.g. Biology" required value={form.course} />
            </label>
            <label className="form-span">
              Date of birth <span className="optional-label">Optional</span>
              <input max={new Date().toISOString().slice(0, 10)} name="dateOfBirth" onChange={updateField} type="date" value={form.dateOfBirth || ''} />
            </label>
          </div>

          {formError && <p className="form-error" role="alert">{formError}</p>}

          <div className="dialog-actions">
            <button className="button button-secondary" disabled={saving} onClick={onClose} type="button">
              Cancel
            </button>
            <button className="button button-primary" disabled={saving} type="submit">
              {saving ? 'Saving…' : student ? 'Save changes' : 'Add student'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [dialogStudent, setDialogStudent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await request();
      setStudents(result.data);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const courses = useMemo(
    () => [...new Set(students.map((student) => student.course).filter(Boolean))]
      .sort((first, second) => first.localeCompare(second)),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) =>
      (!selectedCourse || student.course === selectedCourse) &&
      (!query || [student.firstName, student.lastName, student.email, student.grade, student.course]
        .some((value) => value?.toLowerCase().includes(query)))
    );
  }, [search, selectedCourse, students]);

  async function saveStudent(form) {
    setSaving(true);
    setPageError('');
    const payload = { ...form };
    if (!payload.dateOfBirth) delete payload.dateOfBirth;
    try {
      await request(dialogStudent ? `/${dialogStudent._id}` : '', {
        method: dialogStudent ? 'PATCH' : 'POST',
        body: JSON.stringify(payload)
      });
      setDialogOpen(false);
      setDialogStudent(null);
      await loadStudents();
    } finally {
      setSaving(false);
    }
  }

  async function deleteStudent(student) {
    if (!window.confirm(`Delete ${student.firstName} ${student.lastName}? This cannot be undone.`)) return;
    setPageError('');
    try {
      await request(`/${student._id}`, { method: 'DELETE' });
      setStudents((current) => current.filter((item) => item._id !== student._id));
    } catch (error) {
      setPageError(error.message);
    }
  }

  function openCreateDialog() {
    setDialogStudent(null);
    setDialogOpen(true);
  }

  function openEditDialog(student) {
    setDialogStudent(student);
    setDialogOpen(true);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a aria-label="Student Management home" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            <svg viewBox="0 0 24 24">
              <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" />
              <path d="M7 12v4.3c2.8 2.3 7.2 2.3 10 0V12M21 9.5v5" />
            </svg>
          </span>
          <span>Student<span className="brand-light">Flow</span></span>
        </a>
        <div className="topbar-right">
          <span className="topbar-label">STUDENT MANAGEMENT</span>
          <span aria-hidden="true" className="topbar-avatar">A</span>
        </div>
      </header>

      <main className="main-content">
        <section className="page-heading">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h1>Students</h1>
            <p className="page-description">Manage your student records in one place.</p>
          </div>
          <button className="button button-primary add-button" onClick={openCreateDialog} type="button">
            <span aria-hidden="true" className="plus-icon">+</span>
            Add student
          </button>
        </section>

        <section aria-label="Student statistics" className="stats-grid">
          <article className="stat-card">
            <span className="stat-icon stat-icon-purple" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6m3-3h-6" /></svg>
            </span>
            <div><p className="stat-label">Total students</p><p className="stat-number">{students.length}</p></div>
            <span className="stat-caption">Enrolled</span>
          </article>
          <article className="stat-card">
            <span className="stat-icon stat-icon-blue" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 19V5m0 14h17M8 15l4-4 3 2 6-7" /></svg>
            </span>
            <div><p className="stat-label">Courses</p><p className="stat-number">{new Set(students.map((student) => student.course)).size}</p></div>
            <span className="stat-caption">In progress</span>
          </article>
          <article className="stat-card">
            <span className="stat-icon stat-icon-green" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 19V5m0 14h17M8 15h3v2H8zm5-5h3v7h-3zm5-4h3v11h-3z" /></svg>
            </span>
            <div><p className="stat-label">Grade levels</p><p className="stat-number">{new Set(students.map((student) => student.grade)).size}</p></div>
            <span className="stat-caption">Represented</span>
          </article>
        </section>

        <section aria-labelledby="directory-title" className="directory-card">
          <div className="directory-header">
            <div>
              <h2 id="directory-title">Student directory</h2>
              <p>View and manage your enrolled students.</p>
            </div>
            <div className="directory-controls">
              <label className="course-filter">
                <span>Course</span>
                <select
                  aria-label="Filter by course"
                  onChange={(event) => setSelectedCourse(event.target.value)}
                  value={selectedCourse}
                >
                  <option value="">All courses</option>
                  {courses.map((course) => <option key={course} value={course}>{course}</option>)}
                </select>
              </label>
              <label className="search-box">
                <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
                <input
                  aria-label="Search students"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search students..."
                  type="search"
                  value={search}
                />
                <kbd>/</kbd>
              </label>
            </div>
          </div>

          {pageError && <p className="banner-error" role="alert">{pageError}</p>}

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">STUDENT</th>
                  <th scope="col">GRADE</th>
                  <th scope="col">COURSE</th>
                  <th scope="col">DATE OF BIRTH</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="table-message" colSpan="5">Loading students…</td></tr>
                ) : loadError ? (
                  <tr>
                    <td className="table-message" colSpan="5">
                      <p className="load-error">{loadError}</p>
                      <button className="text-button" onClick={loadStudents} type="button">Try again</button>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td className="table-message empty-state" colSpan="5">
                      <span aria-hidden="true" className="empty-icon">◎</span>
                      <strong>{students.length === 0 ? 'No students yet' : 'No matching students'}</strong>
                      <span>{students.length === 0 ? 'Add your first student to get started.' : 'Try a different search term.'}</span>
                      {students.length === 0 && (
                        <button className="button button-primary empty-add" onClick={openCreateDialog} type="button">Add your first student</button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student._id}>
                      <td>
                        <div className="student-cell">
                          <span aria-hidden="true" className="student-avatar">{initials(student)}</span>
                          <span className="student-details">
                            <strong>{student.firstName} {student.lastName}</strong>
                            <span>{student.email}</span>
                          </span>
                        </div>
                      </td>
                      <td><span className="grade-pill">{student.grade}</span></td>
                      <td>{student.course}</td>
                      <td>{formatDate(student.dateOfBirth)}</td>
                      <td>
                        <div className="row-actions">
                          <button aria-label={`Edit ${student.firstName} ${student.lastName}`} className="row-action" onClick={() => openEditDialog(student)} type="button">Edit</button>
                          <button aria-label={`Delete ${student.firstName} ${student.lastName}`} className="row-action row-action-delete" onClick={() => deleteStudent(student)} type="button">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && !loadError && students.length > 0 && (
            <footer className="directory-footer">
              <span>Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students</span>
              <button className="refresh-button" onClick={loadStudents} type="button">
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5M4 17v-5h5m-4-1a7 7 0 0 1 12-4l3 5M4 12l3 5a7 7 0 0 0 12-4" /></svg>
                Refresh
              </button>
            </footer>
          )}
        </section>
        <p className="page-footnote">Student records are securely managed through your connected API.</p>
      </main>

      {dialogOpen && (
        <StudentDialog
          onClose={() => {
            setDialogOpen(false);
            setDialogStudent(null);
          }}
          onSave={saveStudent}
          saving={saving}
          student={dialogStudent}
        />
      )}
    </div>
  );
}
