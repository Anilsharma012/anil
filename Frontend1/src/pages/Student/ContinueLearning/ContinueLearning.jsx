import React, { useMemo, useState } from "react";
import "./ContinueLearning.css";

const clamp = (n) => Math.max(0, Math.min(100, Number.isFinite(+n) ? +n : 0));

const getVideoEmbed = (url) => {
  if (!url) return { type: "none", src: "" };
  try {
    const u = new URL(url);
    const href = u.href;
    if (href.includes("youtube.com") || href.includes("youtu.be")) {
      // Normalize id
      let id = "";
      if (u.hostname.includes("youtu.be")) id = u.pathname.replace("/", "");
      else if (u.searchParams.get("v")) id = u.searchParams.get("v");
      else if (href.includes("/embed/")) id = href.split("/embed/")[1]?.split("?")[0] || "";
      return { type: "youtube", src: id ? `https://www.youtube.com/embed/${id}` : "" };
    }
    if (href.includes("vimeo.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts[parts.length - 1] || "";
      return { type: "vimeo", src: id ? `https://player.vimeo.com/video/${id}` : "" };
    }
    if (href.endsWith(".mp4") || href.endsWith(".m3u8")) return { type: "file", src: href };
  } catch (_) {}
  return { type: "file", src: url };
};

const TabButton = ({ id, label, active, onClick }) => (
  <button
    role="tab"
    aria-selected={active}
    aria-controls={`tab-panel-${id}`}
    id={`tab-${id}`}
    className={`cl-tab-btn ${active ? "is-active" : ""}`}
    onClick={onClick}
  >
    {label}
  </button>
);

const ContinueLearning = ({ course: courseProp, lesson: lessonProp }) => {
  const course = courseProp || {};
  const lesson = lessonProp || {};
  const progress = clamp(course.progress);
  const [tab, setTab] = useState("overview");
  const video = useMemo(() => getVideoEmbed(course.videoUrl), [course.videoUrl]);

  return (
    <main className="cl-page" aria-labelledby="cl-hero-title">
      {/* Hero */}
      <section className="cl-hero" data-layer="Hero">
        <div className="cl-hero-left">
          <h1 id="cl-hero-title" className="cl-title" data-field="course.title">{course.title || "Course Title"}</h1>
          <div className="cl-meta-row">
            <span className="cl-instructor" data-field="course.instructor">{course.instructor || "Instructor"}</span>
            <span aria-hidden className="cl-dot" />
            <span className="cl-rating" aria-label="Course rating">★★★★★</span>
          </div>
        </div>
        <div className="cl-hero-right">
          <span className="cl-progress-badge" aria-label={`Progress ${progress}%`} data-field="course.progress">{progress}%</span>
          <a className="cl-primary-btn" href="#" aria-label="Resume Lesson">Resume Lesson</a>
        </div>
      </section>

      {/* Layout */}
      <section className="cl-layout" data-layer="Main Layout">
        <div className="cl-main">
          {/* Video */}
          <div className="cl-video" data-layer="Video">
            {video.type === "none" || !video.src ? (
              <div className="cl-video-placeholder" role="status">No video available</div>
            ) : video.type === "file" ? (
              <video className="cl-video-el" src={video.src} controls aria-label="Course video" />
            ) : (
              <div className="cl-embed-wrap">
                <iframe
                  title="Course Video"
                  src={video.src}
                  className="cl-embed"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          {/* Lesson header */}
          <header className="cl-lesson-header" data-layer="Lesson Header">
            <h2 className="cl-lesson-title" data-field="lesson.title">{lesson.title || "Lesson Title"}</h2>
            <p className="cl-lesson-desc" data-field="lesson.description">{lesson.description || "Lesson description will appear here."}</p>
            <div className="cl-lesson-nav">
              <a className="cl-secondary-btn" href="#" aria-label="Previous lesson">Prev Lesson</a>
              <a className="cl-secondary-btn" href="#" aria-label="Next lesson">Next Lesson</a>
            </div>
          </header>

          {/* Tabs */}
          <div className="cl-tabs" role="tablist" aria-label="Course sections" data-layer="Tabs">
            <TabButton id="overview" label="Overview" active={tab === "overview"} onClick={() => setTab("overview")} />
            <TabButton id="syllabus" label="Syllabus" active={tab === "syllabus"} onClick={() => setTab("syllabus")} />
            <TabButton id="resources" label="Resources" active={tab === "resources"} onClick={() => setTab("resources")} />
            <TabButton id="notes" label="Notes" active={tab === "notes"} onClick={() => setTab("notes")} />
          </div>

          <section
            id="tab-panel-overview"
            role="tabpanel"
            aria-labelledby="tab-overview"
            hidden={tab !== "overview"}
            className="cl-card"
            data-layer="Overview"
          >
            <p className="cl-body">Keep learning—track your progress and resume anytime.</p>
          </section>

          <section
            id="tab-panel-syllabus"
            role="tabpanel"
            aria-labelledby="tab-syllabus"
            hidden={tab !== "syllabus"}
            className="cl-card"
            data-layer="Syllabus"
          >
            <ul className="cl-accordion" aria-label="Syllabus list">
              {(course.syllabus || []).map((item, idx) => (
                <li key={idx} className={`cl-acc-item ${item?.status === "completed" ? "is-completed" : item?.status === "locked" ? "is-locked" : ""}`}>
                  <details open={false} className="cl-acc-details">
                    <summary className="cl-acc-summary">
                      <span className="cl-acc-title" data-field={`course.syllabus[${idx}].title`}>{item?.title || "Lesson"}</span>
                      <span className="cl-acc-meta">
                        <span className="cl-acc-duration" data-field={`course.syllabus[${idx}].duration`}>{item?.duration || "--"}</span>
                        <span className={`cl-status ${item?.status || ""}`} data-field={`course.syllabus[${idx}].status`}>{item?.status || "unlocked"}</span>
                      </span>
                    </summary>
                    <div className="cl-acc-body">
                      <a href="#" className="cl-secondary-btn">Open Lesson</a>
                    </div>
                  </details>
                </li>
              ))}
              {(!course.syllabus || course.syllabus.length === 0) && (
                <li className="cl-acc-empty">No syllabus added yet.</li>
              )}
            </ul>
          </section>

          <section
            id="tab-panel-resources"
            role="tabpanel"
            aria-labelledby="tab-resources"
            hidden={tab !== "resources"}
            className="cl-card"
            data-layer="Resources"
          >
            <ul className="cl-resource-list">
              {(course.resources || []).map((r, idx) => (
                <li key={idx} className="cl-resource-item">
                  <span className="cl-resource-icon" aria-hidden>📄</span>
                  <a href={r?.url || "#"} target="_blank" rel="noreferrer" className="cl-resource-link" data-field={`course.resources[${idx}].url`}>
                    <span data-field={`course.resources[${idx}].label`}>{r?.label || "Resource"}</span>
                  </a>
                </li>
              ))}
              {(!course.resources || course.resources.length === 0) && <li className="cl-acc-empty">No resources yet.</li>}
            </ul>
          </section>

          <section
            id="tab-panel-notes"
            role="tabpanel"
            aria-labelledby="tab-notes"
            hidden={tab !== "notes"}
            className="cl-card"
            data-layer="Notes"
          >
            <label htmlFor="note" className="cl-label">Notes</label>
            <textarea id="note" className="cl-textarea" placeholder="Write your note here…" rows={6} />
            <div className="cl-note-actions">
              <button className="cl-primary-btn" type="button">Save Note</button>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="cl-sidebar" data-layer="Sidebar">
          <div className="cl-card cl-sticky">
            <div className="cl-sidebar-section">
              <h3 className="cl-subtitle">Next Lesson</h3>
              <div className="cl-next-title" data-field="lesson.title">{lesson.title || "Lesson Title"}</div>
              <div className="cl-next-muted" data-field="lesson.duration">{lesson.duration || "--"}</div>
              <div className="cl-progress-track" aria-label="Next lesson progress">
                <div className="cl-progress-fill" style={{ width: "40%" }} />
              </div>
            </div>

            <div className="cl-sidebar-section">
              <h3 className="cl-subtitle">Your Progress</h3>
              <div className="cl-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                <div className="cl-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="cl-progress-text" data-field="course.progress">{progress}% complete</div>
            </div>

            <div className="cl-sidebar-section">
              <h3 className="cl-subtitle">Quick Actions</h3>
              <div className="cl-actions">
                <a className="cl-secondary-btn" href="#">Mark as Complete</a>
                <a className="cl-secondary-btn" href="#">Download PDF</a>
                <a className="cl-secondary-btn" href="#">Ask Doubt (WhatsApp)</a>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <footer className="cl-footer" data-layer="Footer">
        <div className="cl-footer-text">You’re close to completing this course.</div>
        <a className="cl-secondary-btn" href="#">Back to My Courses</a>
      </footer>
    </main>
  );
};

export default ContinueLearning;
