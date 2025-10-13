// CoursePurchase.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import './CoursePurchase.css';

import one from "../../images/one1.png";
import two from "../../images/two2.png";
import three from "../../images/three3.png";

import reviewMain from "../../images/REVIEW5.PNG";   // existing big image (right side)
import review3 from "../../images/Reviewnewimage6.jpg";      // NEW 1
import review4 from "../../images/Reviewnewimage.jpeg";      // NEW 2
import review6 from "../../images/Reviewnewimage4.jpg";      // NEW 3

import frame from "../../images/frameCourse.png";
import Chatbox from '../../components/Chat/Chatbox';

// NOTE: Bootstrap <link> ko index.html me include karna chahiye. JSX file ke top par <link> likhne se error aata hai.
// <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css" />

const curriculumData = [
  { title: 'Welcome! Course Introduction', content: 'What does the course cover?' },
  { title: 'Foundation Phase – Concept Building', content: '' },
  { title: 'Application Phase – Practice & Assignments', content: '' },
  { title: 'CopyCAT Mock Test Series', content: '' },
  { title: 'CAT Crash Course – Final Lap', content: '' }
];

const instructors = [
  { name: 'Rajat Tathagat', expertise: 'Quant/LRDI', image: three },
  { name: 'Kumar Abhishek', expertise: 'Verbal', image: two },
  { name: 'Niraj Naiyar', expertise: 'Quant/LRDI', image: one }
];

const CoursePurchase = () => {
  const [openCurriculumIndex, setOpenCurriculumIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview"); // overview | curriculum | instructor | reviews
  const [courseDetails, setCourseDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Sections refs for scroll
  const topRef = useRef(null);           // whole page top
  const overviewRef = useRef(null);
  const curriculumRef = useRef(null);
  const instructorRef = useRef(null);
  const reviewsRef = useRef(null);

  // NEW: Journey section ref (for hash navigation)
  const journeyRef = useRef(null);

  const ratings = { 5: 5, 4: 0.2, 3: 0.1, 2: 0.08, 1: 0.04 };
  const total = Object.values(ratings).reduce((a, b) => a + b, 0);
  const avgRaw = total
    ? Object.entries(ratings).reduce((s, [star, cnt]) => s + Number(star) * cnt, 0) / total
    : 0;

  // Show 4.9 (round up to 1 decimal)
  const displayAvg = Math.ceil(avgRaw * 10) / 10;
  const starFill = (avgRaw / 5) * 100; // 4.9/5 = 98%

  // Provide fallback course data if location.state is null
  const course = location.state || {
    _id: '6835a4fcf528e08ff15a566e',
    name: 'CAT 2025 Full Course',
    price: 1500,
    description: 'Complete CAT preparation course',
    features: [
      'Complete CAT preparation material',
      'Live interactive classes',
      'Mock tests and practice sets',
      'Doubt clearing sessions',
      'Performance analysis',
      'Study materials download'
    ]
  };

  useEffect(() => {
    if (!location.state) {
      console.warn('⚠️ No course data received from navigation, using fallback course');
    }
    const search = new URLSearchParams(location.search);
    const paramId = search.get('courseId');
    const stateId = (location.state && location.state._id) || null;
    const id = stateId || paramId;
    if (!id) return;

    let cancelled = false;
    (async () => {
      try {
        setDetailsLoading(true);
        const res = await fetch(`/api/courses/student/published-courses/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const c = data.course || data.data || data;
        if (!cancelled) setCourseDetails(c);
      } catch (e) {
        console.warn('Failed to load course details, using provided state/fallback', e.message);
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [location.state, location.search]);

  // Smooth scroll with header offset
  const scrollWithOffset = (element) => {
    if (!element) return;
    const yOffset = -90; // adjust if your header height differs
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const handleTabClick = (key) => {
    setActiveTab(key);
    const map = {
      overview: overviewRef.current,
      curriculum: curriculumRef.current,
      instructor: instructorRef.current,
      reviews: reviewsRef.current
    };
    scrollWithOffset(map[key]);
  };

  // Auto-highlight active tab while scrolling (Intersection Observer)
  useEffect(() => {
    const sections = [
      { key: "overview", el: overviewRef.current },
      { key: "curriculum", el: curriculumRef.current },
      { key: "instructor", el: instructorRef.current },
      { key: "reviews", el: reviewsRef.current }
    ].filter(s => s.el);

    const observer = new IntersectionObserver(
      (entries) => {
        // pick the section most in view
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const match = sections.find(s => s.el === visible.target);
          if (match && match.key !== activeTab) setActiveTab(match.key);
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0.1, 0.25, 0.5, 0.75] }
    );

    sections.forEach(s => observer.observe(s.el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NEW: when URL has #cat-journey, smooth-scroll to the Journey section after mount
  useEffect(() => {
    if (location.hash === "#cat-journey") {
      const t = setTimeout(() => {
        scrollWithOffset(journeyRef.current);
      }, 100); // slight delay so images/layout mount
      return () => clearTimeout(t);
    }
  }, [location.hash]);

  const handlePayment = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("❌ Please login first! Use the 👤 button in the top notification bar, or click '🔧 Demo Login' below");
      return;
    }

    if (!course || !course._id) {
      alert("❌ Course information not available. Please go back and select a course.");
      navigate('/');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      const confirmed = window.confirm("🔧 Development Mode: Skip payment and directly unlock course?");
      if (confirmed) {
        try {
          const response = await fetch("/api/user/payment/verify-and-unlock", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id: 'dev_order_' + Date.now(),
              razorpay_payment_id: 'dev_payment_' + Date.now(),
              razorpay_signature: 'dev_signature',
              courseId: course._id
            })
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              alert("✅ Development course unlock successful!");
              navigate("/student/dashboard", { state: { showMyCourses: true, refreshCourses: true } });
              return;
            }
          }
          alert("❌ Development unlock failed, proceeding with normal payment...");
        } catch (error) {
          console.error('Development unlock error:', error);
          alert("❌ Development unlock error, proceeding with normal payment...");
        }
      }
    }

    try {
      // Check already unlocked
      const checkRes = await fetch("/api/user/student/my-courses", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (checkRes.ok) {
        try {
          const checkData = await checkRes.json();
          const courseId = (course && course._id) || null;
          const realEnrollments = (checkData.courses || []).filter(c => c._id && !c._id.toString().startsWith('demo_'));
          const alreadyUnlocked = courseId && realEnrollments.some(c => {
            const enrolledCourseId = (c.courseId && c.courseId._id) || c.courseId;
            return enrolledCourseId && enrolledCourseId.toString() === courseId.toString();
          });
          if (alreadyUnlocked) {
            alert("✅ You have already purchased/unlocked this course.");
            return;
          }
        } catch { /* continue */ }
      }

      // Fetch course price if possible
      let amountInPaise = ((course && course.price) || 1500) * 100;
      let courseName = (course && course.name) || "Course Purchase";

      try {
        const courseId = (course && course._id) || '6835a4fcf528e08ff15a566e';
        const courseRes = await fetch(`/api/courses/student/published-courses/${courseId}`);
        if (courseRes.ok) {
          const courseData = await courseRes.json();
          const c = courseData.course || courseData.data || courseData;
          if (c && (c.price || c.name)) {
            if (typeof c.price === 'number') amountInPaise = c.price * 100;
            courseName = c.name || courseName;
          }
        }
      } catch { /* ignore and use defaults */ }

      // Create order
      const orderRes = await fetch("/api/user/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amountInPaise, courseId: course._id })
      });

      if (!orderRes.ok) {
        alert(`❌ Failed to create order: ${orderRes.status} ${orderRes.statusText}`);
        return;
      }

      const orderData = await orderRes.json();
      if (!orderData.success) {
        alert("❌ Failed to create order: " + (orderData.message || 'Unknown error'));
        return;
      }

      const options = {
        key: "rzp_test_JLdFnx7r5NMiBS",
        amount: orderData.order.amount,
        currency: "INR",
        name: "Tathagat Academy",
        description: courseName,
        order_id: orderData.order.id,
        handler: function (response) {
          fetch("/api/user/payment/verify-and-unlock", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: course._id
            })
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                alert("✅ Payment verified & course unlocked!");
                navigate("/student/dashboard", { state: { showMyCourses: true, refreshCourses: true } });
              } else {
                alert("❌ Payment verification failed: " + data.message);
              }
            })
            .catch(err => {
              console.error("❌ Verification error:", err);
              alert("❌ Something went wrong. Please contact support.");
            });
        },
        prefill: { name: "Test User", email: "test@example.com", contact: "9999999999" },
        theme: { color: "#3399cc" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.log(response.error);
        alert("❌ Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (err) {
      console.error("❌ Error in handlePayment:", err);
      alert("❌ Something went wrong. Please try again.");
    }
  };

  const toEmbedUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    try {
      // Handle youtu.be short links
      const short = url.match(/^https?:\/\/youtu\.be\/([\w-]{11})/i);
      if (short) return `https://www.youtube.com/embed/${short[1]}`;
      // Handle standard watch URLs
      const u = new URL(url);
      if ((u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) && (u.searchParams.get('v') || u.pathname.includes('/embed/'))) {
        const id = u.searchParams.get('v') || u.pathname.split('/').pop();
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      // If already an embed link, pass through
      if (/\/embed\//.test(url)) return url;
      return '';
    } catch { return ''; }
  };

  const toggleCurriculum = (index) => {
    setOpenCurriculumIndex(index === openCurriculumIndex ? null : index);
  };

  const mergedCourse = {
    ...course,
    ...(courseDetails || {}),
    overview: {
      ...(course.overview || {}),
      ...((courseDetails && courseDetails.overview) || {})
    }
  };

  const materialIncludes = Array.isArray(mergedCourse?.overview?.materialIncludes)
    ? mergedCourse.overview.materialIncludes
    : (Array.isArray(course?.features) ? course.features : []);

  const requirements = Array.isArray(mergedCourse?.overview?.requirements)
    ? mergedCourse.overview.requirements
    : [];

  return (
    <div ref={topRef} className="course-page container">
      <div className="row">
        {/* Left Section: 60% */}
        <div className="col-lg-9 left-sections">
          {/* Video */}
          <div className="video-banners">
            {(() => {
              const preferred = toEmbedUrl(mergedCourse?.overview?.videoUrl);
              const src = preferred || "https://www.youtube.com/embed/aDXkJwqAiP4?si=gtkt5zJpNyAy7LBS";
              return (
                <iframe
                  width="100%"
                  height="600"
                  src={src}
                  title="Course Intro Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              );
            })()}
          </div>

          {/* Title */}
          <h2 className="course-title">{mergedCourse?.name || course?.name || 'CAT 2025 Full Course IIM ABC Practice Batch'}</h2>

          {/* Info Grid */}
          <div className="info-grid">
            <div className="info-item">
              <span className="icon">👨‍🏫</span>
              <div>
                <div className="label">Instructor</div>
                <div className="value">Kumar Abhishek</div>
              </div>
            </div>
            <div className="info-item">
              <span className="icon">📚</span>
              <div>
                <div className="label">Category</div>
                <div className="value">CAT</div>
              </div>
            </div>
            <div className="info-item">
              <span className="icon">👥</span>
              <div>
                <div className="label">Students Enrolled</div>
                <div className="value">200</div>
              </div>
            </div>
            <div className="info-item">
              <span className="icon">⭐</span>
              <div>
                <div className="label">Reviews</div>
                <div className="value">4.9 (Google)</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="course-tabs-section" ref={overviewRef}>
            <div className="tab-buttons">
              <button
                className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => handleTabClick("overview")}
              >
                📘 Overview
              </button>
              <button
                className={`tab-btn ${activeTab === "curriculum" ? "active" : ""}`}
                onClick={() => handleTabClick("curriculum")}
              >
                📄 Curriculum
              </button>
              <button
                className={`tab-btn ${activeTab === "instructor" ? "active" : ""}`}
                onClick={() => handleTabClick("instructor")}
              >
                👤 Instructor
              </button>
              <button
                className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
                onClick={() => handleTabClick("reviews")}
              >
                ⭐ Reviews
              </button>
            </div>

            {/* Overview Content */}
            <div className="tab-content">
              <h3>About The Course</h3>
              {(mergedCourse?.overview?.about || mergedCourse?.overview?.description) ? (
                <div
                  className="course-overview-html"
                  dangerouslySetInnerHTML={{ __html: mergedCourse?.overview?.about || mergedCourse?.overview?.description }}
                />
              ) : (
                <>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  </p>
                  <p>
                    The passage experienced a surge in popularity during the 1960s when Letraset used it on their dry-transfer sheets, and again during the 90s as desktop publishers bundled the text with their software.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Curriculum */}
          <div className="curriculum-wrapper" ref={curriculumRef}>
            <h3>The Course Curriculum</h3>
            {curriculumData.map((item, index) => (
              <div
                className={`curriculum-item ${openCurriculumIndex === index ? 'active' : ''}`}
                key={index}
                onClick={() => toggleCurriculum(index)}
              >
                <div className="curriculum-title">
                  {item.title}
                  <span className="arrow">{openCurriculumIndex === index ? '▾' : '▸'}</span>
                </div>
                {openCurriculumIndex === index && item.content && (
                  <div className="curriculum-content">{item.content}</div>
                )}
              </div>
            ))}
          </div>

          {/* Instructor */}
          <div className="instructor-section" ref={instructorRef}>
            <h3>Meet Your Instructor</h3>
            <div className="instructor-grid">
              {instructors.map((ins, index) => (
                <div className="instructor-card" key={index}>
                  <div className="instructor-img">
                    <img src={ins.image} alt={ins.name} />
                  </div>
                  <div className="instructor-info">
                    <div><strong>Name -</strong> {ins.name}</div>
                    <div><strong>Expertise -</strong> {ins.expertise}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="review-section" ref={reviewsRef}>
            <h3>Our Valuable Reviews</h3>
            <div className="review-layout">
              {/* Left: Rating Summary */}
              <div className="rating-summary">
                <div>
                  <div className="rating-score">{displayAvg.toFixed(1)}</div>

                  {/* partial-fill stars */}
                  <div className="rating-stars" style={{ '--percent': `${starFill}%` }}>
                    <span className="stars-outer">★★★★★</span>
                    <span className="stars-inner">★★★★★</span>
                  </div>

                  <p className="total-rating">1,932 reviews</p>
                </div>

                <div className="rating-bars">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div className="bar-line" key={star}>
                      <span className="star">☆</span> <span>{star}</span>
                      <div className="bar">
                        <div
                          className="fill"
                          style={{ width: `${total ? ((ratings[star] || 0) / total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Image */}
              <div className="review-image-box">
                <img src={reviewMain} alt="Review Summary" />
              </div>
            </div>

            {/* NEW: extra review images row */}
            <div className="reviews-gallery">
              <img src={review3} alt="Student Review 3" />
              <img src={review4} alt="Student Review 4" />
              <img src={review6} alt="Student Review 6" />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-md-3 right-section">
          <div className="course-info-box">
            <div className="course-title-box">
              {mergedCourse?.title || mergedCourse?.name || "COURSE TITLE"}
            </div>

            <div style={{ fontSize: "20px", fontWeight: "600", marginBottom: "12px", color: "#1A237E" }}>
              Price: <span style={{ color: "#D32F2F" }}>{mergedCourse?.price ? `₹${mergedCourse.price}` : "₹30,000/-"}</span>
              <del style={{ marginLeft: "8px", color: "#888" }}>{mergedCourse?.oldPrice || "₹1,20,000/-"}</del>
            </div>

            <div
              className="course-description-box"
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                paddingRight: "5px",
                fontSize: "15px",
                color: "#333",
                lineHeight: "1.6",
              }}
            >
              <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
                {Array.isArray(materialIncludes) && materialIncludes.length > 0 ? (
                  materialIncludes.map((feat, idx) => (
                    <li key={idx} style={{ marginBottom: "6px" }}>
                      {feat}
                    </li>
                  ))
                ) : (
                  <li>No description available.</li>
                )}
              </ul>
            </div>
 
            <button
  className="buy-btn"
  style={{
    backgroundColor: "#1A237E",
    fontSize: "16px",
    padding: "12px",
    fontWeight: "600",
    borderRadius: "8px",
    marginTop: "15px",
    transition: "0.3s",
  }}
  onClick={() =>
    window.open(
      "https://pages.razorpay.com/pl_L4RlLDUmQHzJRO/view",
      "_blank",
      "noopener,noreferrer"
    )
  }
>
  Buy Now
</button>

          </div>

          {/* Material Includes */}
          <div className="material-box">
            <h4>Material Includes</h4>
            <ul className="material-list">
              {Array.isArray(materialIncludes) && materialIncludes.length > 0 ? (
                materialIncludes.map((item, idx) => <li key={idx}>{item}</li>)
              ) : (
                <>
                  <li>Certificate of Completion</li>
                  <li>444 downloadable resource</li>
                  <li>Full lifetime access</li>
                  <li>1300+ Hours of Videos</li>
                  <li>20 Mocks & 45 Sectional Mocks</li>
                </>
              )}
            </ul>
          </div>

          {/* Requirements */}
          <div className="material-box">
            <h4>Requirements</h4>
            <ul className="material-list">
              {Array.isArray(requirements) && requirements.length > 0 ? (
                requirements.map((item, idx) => <li key={idx}>{item}</li>)
              ) : (
                <>
                  <li>Required minimum gradution score to appear in CAT</li>
                  <li>50% For General/OBC & 45% For SC/ST/PwD candidates</li>
                  <li>Final year bachelor's degree candidates or those awaiting their result are also eligible to appear for the CAT exam.</li>
                  <li>Candidates with profeessional qualification such as CA/CS/ICWA can also appear foe CAT.</li>
                  <li>10th or 12th scores do not affect the CAT Eligibility</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
<Chatbox/>
      {/* Journey Image — give it an id for hash navigation and attach the ref */}
      <div id="cat-journey" ref={journeyRef} className="cat-journey-wrapper">
        <img src={frame} alt="CAT Learning Journey" className="journey-image" />
      </div>
    </div>
    
  );
  
};

export default CoursePurchase;
