/**
 * ==========================================================================
 * 21st Academy Career Guidance Chatbot JS
 * Traditional Rule-Based & Expert Scoring Assessment Engine
 * ==========================================================================
 */

// --- Constants & Database Mock ---
const ACADEMY_COURSES = [
    "Power BI",
    "Networking CCNA",
    "Mobile App Development",
    "HR Analytics",
    "Generative AI",
    "Full Stack Development",
    "Digital Marketing",
    "DevOps",
    "Data Science",
    "Data Engineering",
    "Cyber Security",
    "Cloud Computing AWS",
    "Business Data Analytics",
    "Automation Testing"
];

const CONTACT_INFO = {
    address: "Hayath Plaza, Nambi Street, Poonamallee, Chennai 600056",
    phone: "+91 9944747090",
    email: "admin@21stacademy.in",
    website: "https://www.21stacademy.in"
};

// Career Details & Visual Roadmaps
const CAREERS = {
    AI_ENGINEER: {
        title: "AI Engineer",
        courses: ["Data Science", "Generative AI"],
        desc: "Develop machine learning models, neural networks, and generative AI systems to solve complex analytical problems.",
        roadmap: [
            {
                phase: "Phase 1: Foundations",
                desc: "Learn programming basics, statistics, and algebraic concepts required for analytical models.",
                tools: ["Python Basics", "Linear Algebra", "Probability & Statistics", "SQL"]
            },
            {
                phase: "Phase 2: Machine Learning",
                desc: "Build classical machine learning models for forecasting, classification, and grouping data.",
                tools: ["Pandas", "NumPy", "Scikit-Learn", "Regression", "Decision Trees"]
            },
            {
                phase: "Phase 3: Deep Learning & NLP",
                desc: "Work with neural network layers, computer vision concepts, and text processing models.",
                tools: ["TensorFlow", "PyTorch", "ANN", "CNN", "Natural Language Processing"]
            },
            {
                phase: "Phase 4: Generative AI",
                desc: "Train or fine-tune models, create conversational apps, and use APIs to build AI products.",
                tools: ["Prompt Engineering", "Large Language Models (LLMs)", "LangChain", "Vector Databases"]
            }
        ]
    },
    FULL_STACK_DEVELOPER: {
        title: "Full Stack Developer",
        courses: ["Full Stack Development"],
        desc: "Build responsive user interfaces and backend database engines that fuel web and mobile applications.",
        roadmap: [
            {
                phase: "Phase 1: Frontend Basics",
                desc: "Master the building blocks of the web and style web pages for responsive, interactive user experiences.",
                tools: ["HTML5", "CSS3", "JavaScript ES6", "Flexbox & Grid", "DOM Manipulation"]
            },
            {
                phase: "Phase 2: Advanced Frontend UI",
                desc: "Create dynamic single-page web applications using powerful frontend frameworks and modular UI structures.",
                tools: ["React.js", "Tailwind CSS", "State Management", "Routing", "APIs Fetching"]
            },
            {
                phase: "Phase 3: Backend & Database",
                desc: "Develop server-side logic, create RESTful web APIs, and model relational or document-based database storages.",
                tools: ["Node.js", "Express.js", "MongoDB", "SQL / PostgreSQL", "User Authentication"]
            },
            {
                phase: "Phase 4: Architecture & Deploy",
                desc: "Learn version control systems, prepare cloud build runs, and deploy software services globally.",
                tools: ["Git & GitHub", "Docker", "REST API Design", "AWS Deployment", "CI/CD pipelines"]
            }
        ]
    },
    CYBER_SECURITY_ENGINEER: {
        title: "Cyber Security Engineer",
        courses: ["Cyber Security", "Networking CCNA"],
        desc: "Secure infrastructure pipelines, perform vulnerability checks, and protect databases from external network intrusions.",
        roadmap: [
            {
                phase: "Phase 1: Networks & Systems",
                desc: "Understand operating systems (Linux, Windows Server) and TCP/IP routing layouts to comprehend how data flows.",
                tools: ["Linux Command Line", "TCP/IP Protocol Suite", "DNS & DHCP", "Wireshark Packet Analysis"]
            },
            {
                phase: "Phase 2: Security & Audits",
                desc: "Learn secure authentication guidelines, configure firewalls, and study common encryption types.",
                tools: ["Cryptography Basics", "Firewall Configuration", "Access Control Lists (ACLs)", "IDS/IPS Systems"]
            },
            {
                phase: "Phase 3: Penetration Testing",
                desc: "Perform ethical hacking procedures in a test sandbox environment to find vulnerabilities in software.",
                tools: ["Kali Linux", "Nmap Port Scan", "Metasploit Framework", "OWASP Top 10 Web Exploit"]
            },
            {
                phase: "Phase 4: Operations & Defense",
                desc: "Monitor event trackers to defend systems, report incidents, and implement threat prevention strategies.",
                tools: ["SIEM Log Analysis", "Incident Response Protocols", "Security Auditing & Compliance"]
            }
        ]
    },
    CLOUD_ENGINEER: {
        title: "Cloud Engineer",
        courses: ["Cloud Computing AWS", "DevOps"],
        desc: "Design scalable cloud infrastructure layouts, automate software deployment processes, and monitor online server runtimes.",
        roadmap: [
            {
                phase: "Phase 1: Admin & Linux Shells",
                desc: "Master system command administration and networking topologies which serve as the base of cloud instances.",
                tools: ["Linux Shell Scripting", "SSH Access", "VPC Networking", "IAM Credentials"]
            },
            {
                phase: "Phase 2: AWS Services Setup",
                desc: "Deploy core cloud hosting products, scale instances automatically, and link databases to servers.",
                tools: ["AWS EC2 Host", "AWS S3 Storage", "Auto-Scaling Groups", "RDS Database Cloud"]
            },
            {
                phase: "Phase 3: DevOps Automation",
                desc: "Adopt Infrastructure-as-Code to create environments through code, and configure containerized applications.",
                tools: ["Terraform Scripts", "Docker Containers", "Ansible Configuration", "Git Flow"]
            },
            {
                phase: "Phase 4: Orchestration & CI/CD",
                desc: "Scale microservices across clusters and automate building, testing, and deployment pipelines.",
                tools: ["Kubernetes (EKS)", "Jenkins / GitHub Actions", "CloudWatch Monitoring", "Load Balancing"]
            }
        ]
    },
    BUSINESS_ANALYST: {
        title: "Business Analyst",
        courses: ["Business Data Analytics", "Power BI", "HR Analytics"],
        desc: "Bridge operational metrics with system solutions, analyze processes, and translate numerical data into visual business charts.",
        roadmap: [
            {
                phase: "Phase 1: Analytical Foundations",
                desc: "Build reports, track data using formulas, and create clean dashboard calculations.",
                tools: ["Advanced MS Excel", "Data Cleaning", "Pivot Tables & Charts", "Statistical Summaries"]
            },
            {
                phase: "Phase 2: SQL Data Querying",
                desc: "Write query statements to search, filter, join, and extract key metrics from relational business databases.",
                tools: ["SQL Queries", "Relational Database joins", "Data Aggregation", "Subqueries"]
            },
            {
                phase: "Phase 3: Visual Dashboards",
                desc: "Transform database reports into interactive, real-time dashboards for executives to monitor KPIs.",
                tools: ["Power BI", "DAX Formulas", "Data Modeling", "Tableau Charts"]
            },
            {
                phase: "Phase 4: Strategy & Forecasting",
                desc: "Create data-driven business models, present roadmap projects, and predict market sales trends.",
                tools: ["Business Metrics KPIs", "Time Series Forecast", "Agile Product Management", "Presentations"]
            }
        ]
    },
    DIGITAL_MARKETING_SPECIALIST: {
        title: "Digital Marketing Specialist",
        courses: ["Digital Marketing"],
        desc: "Grow online brands, optimize search visibility, run advertisement campaigns, and configure growth marketing funnels.",
        roadmap: [
            {
                phase: "Phase 1: Marketing & Funnels",
                desc: "Learn consumer psychology, study customer personas, and structure high-converting marketing funnels.",
                tools: ["Content Strategy", "Copywriting Basics", "Lead Generation Funnels", "Brand Positioning"]
            },
            {
                phase: "Phase 2: Search Optimization (SEO)",
                desc: "Improve website search rankings, analyze search keywords, and resolve page indexing structures.",
                tools: ["Google Search Console", "Keyword Analysis", "On-Page SEO", "Technical SEO Audits"]
            },
            {
                phase: "Phase 3: Paid Ads Management",
                desc: "Configure target audiences, outline budget bids, and launch paid advertising campaigns.",
                tools: ["Meta Ads Manager", "Google Ads Network", "A/B Test Ad copy", "Cost per Acquisition (CPA)"]
            },
            {
                phase: "Phase 4: Analytics & CRO",
                desc: "Track user clicks, measure traffic ROI metrics, and optimize websites to maximize sales.",
                tools: ["Google Analytics 4 (GA4)", "Conversion Rate Optimization", "Email Marketing Flow", "Tag Manager"]
            }
        ]
    }
};

// --- Chatbot States ---
const STATES = {
    MAIN_MENU: "MAIN_MENU",
    CAREER_ASSESSMENT: "CAREER_ASSESSMENT",
    COURSE_RECOMMENDATION: "COURSE_RECOMMENDATION",
    EXITED: "EXITED"
};

// --- Stateful Variables ---
let currentState = STATES.MAIN_MENU;
let currentQuestionIndex = 0;

// Interactive Quiz Accumulator Variables
let userScores = {
    coding: 0,
    mathData: 0,
    creativity: 0,
    communication: 0,
    security: 0,
    cloud: 0
};

// 10 Weighted Multiple-Choice Questions
const ASSESSMENT_QUESTIONS = [
    {
        question: "Which of these tasks sounds most exciting to you?",
        options: [
            { letter: "A", text: "Building beautiful, interactive user interfaces and websites.", weights: { coding: 2, creativity: 3 } },
            { letter: "B", text: "Teaching a computer to find patterns in data or predict trends.", weights: { coding: 1, mathData: 3 } },
            { letter: "C", text: "Setting up secure systems and tracking down network security gaps.", weights: { security: 3 } },
            { letter: "D", text: "Configuring online servers and automating software pipelines.", weights: { cloud: 3 } },
            { letter: "E", text: "Leading team presentations and analyzing marketing metrics.", weights: { communication: 3 } }
        ]
    },
    {
        question: "How do you feel about mathematics, numbers, and statistics?",
        options: [
            { letter: "A", text: "I love them! I enjoy solving logical formulas and analyzing data models.", weights: { mathData: 3 } },
            { letter: "B", text: "They are fine; I can write logical code to handle mathematical issues.", weights: { coding: 2, mathData: 1 } },
            { letter: "C", text: "I prefer working on visual styling, graphic designs, or marketing plans.", weights: { creativity: 2, communication: 1 } },
            { letter: "D", text: "I prefer configuring infrastructure, network devices, and security rules.", weights: { security: 2, cloud: 2 } }
        ]
    },
    {
        question: "When faced with a problem, what is your first instinct?",
        options: [
            { letter: "A", text: "Write script code to automate the solution process.", weights: { coding: 3 } },
            { letter: "B", text: "Sketch visual layouts, mockups, or draw design components.", weights: { creativity: 3 } },
            { letter: "C", text: "Investigate log entries to identify network loops or threats.", weights: { security: 3 } },
            { letter: "D", text: "Spin up a hosting server and build virtual routers.", weights: { cloud: 3 } },
            { letter: "E", text: "Discuss with team members and coordinate a business strategy.", weights: { communication: 3 } }
        ]
    },
    {
        question: "How do you like working with spreadsheets, databases, and charts?",
        options: [
            { letter: "A", text: "I love database queries and finding insights inside records.", weights: { mathData: 3 } },
            { letter: "B", text: "I prefer writing code to render database records on page layouts.", weights: { coding: 2, creativity: 1 } },
            { letter: "C", text: "I like networking layouts and cloud storage configurations.", weights: { security: 2, cloud: 2 } },
            { letter: "D", text: "I like making brand projections and sales funnels.", weights: { communication: 3 } }
        ]
    },
    {
        question: "What is your comfort level with public speaking or client pitching?",
        options: [
            { letter: "A", text: "Very comfortable, I enjoy sales, storytelling, and marketing.", weights: { communication: 3 } },
            { letter: "B", text: "Comfortable coordinating within small technical agile teams.", weights: { communication: 1 } },
            { letter: "C", text: "I prefer coding or setting up servers in a focused workspace.", weights: { coding: 2, security: 1, cloud: 1 } },
            { letter: "D", text: "I prefer writing technical documentation or analytical data sheets.", weights: { mathData: 2 } }
        ]
    },
    {
        question: "Which technology topic captures your curiosity the most?",
        options: [
            { letter: "A", text: "AI neural networks, large language models (LLMs), or big data.", weights: { mathData: 3, coding: 1 } },
            { letter: "B", text: "Polished web applications, frontend widgets, or interactive UI.", weights: { creativity: 3, coding: 2 } },
            { letter: "C", text: "Ethical hacking, firewall setups, and scanning network logs.", weights: { security: 3 } },
            { letter: "D", text: "VPC routing, AWS computing instances, and Docker containers.", weights: { cloud: 3 } },
            { letter: "E", text: "Social media marketing campaigns, SEO rules, and online branding.", weights: { communication: 3 } }
        ]
    },
    {
        question: "What project challenge sounds most satisfying to build?",
        options: [
            { letter: "A", text: "Designing a high-converting website layout and logo.", weights: { creativity: 3 } },
            { letter: "B", text: "Writing a script in Python to gather metrics from web APIs.", weights: { coding: 3, mathData: 1 } },
            { letter: "C", text: "Auditing a website setup to block potential hacker injection attacks.", weights: { security: 3 } },
            { letter: "D", text: "Deploying a website to the cloud to make it globally scale.", weights: { cloud: 3 } },
            { letter: "E", text: "Formulating a business growth pitch deck and campaign map.", weights: { communication: 3 } }
        ]
    },
    {
        question: "How do you feel about writing raw program code?",
        options: [
            { letter: "A", text: "I love writing code! I want programming to be my primary daily task.", weights: { coding: 4 } },
            { letter: "B", text: "I like writing code, but also want to work with servers or networks.", weights: { coding: 2, cloud: 2, security: 2 } },
            { letter: "C", text: "I prefer low-code analytics dashboards (Power BI) and data cleaning.", weights: { mathData: 3 } },
            { letter: "D", text: "I prefer to avoid coding and focus on advertising, writing, or sales.", weights: { communication: 3 } }
        ]
    },
    {
        question: "How do you handle detail-oriented tasks?",
        options: [
            { letter: "A", text: "I notice minor items: single code syntax typos or port anomalies bug me.", weights: { coding: 2, security: 3 } },
            { letter: "B", text: "I focus on the big-picture visual flow and customer layouts.", weights: { creativity: 3 } },
            { letter: "C", text: "I check that server structures and cloud configs are orderly.", weights: { cloud: 3 } },
            { letter: "D", text: "I think about human dynamics, user behavior, and market results.", weights: { communication: 3 } }
        ]
    },
    {
        question: "What is your primary career goal in the IT domain?",
        options: [
            { letter: "A", text: "Build automated, data-driven AI systems.", weights: { mathData: 3, coding: 2 } },
            { letter: "B", text: "Deliver complete web products, coding both front and back ends.", weights: { coding: 3, creativity: 2 } },
            { letter: "C", text: "Provide penetration testing and security audits.", weights: { security: 3 } },
            { letter: "D", text: "Oversee virtual systems and scale cloud platforms.", weights: { cloud: 3 } },
            { letter: "E", text: "Formulate business analytics plans or execute digital campaigns.", weights: { communication: 3 } }
        ]
    }
];

// --- DOM Elements ---
const chatMessages = document.getElementById("chatMessages");
const quickOptionsContainer = document.getElementById("quickOptionsContainer");
const chatInputForm = document.getElementById("chatInputForm");
const chatInput = document.getElementById("chatInput");
const restartBtn = document.getElementById("restartBtn");
const mobileToggle = document.getElementById("mobileToggle");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("closeSidebar");
const courseSearch = document.getElementById("courseSearch");
const courseList = document.getElementById("courseList");
const courseCount = document.getElementById("courseCount");

// Sidebar overlay setup
const overlay = document.querySelector(".sidebar-overlay") || (() => {
    const o = document.createElement("div");
    o.className = "sidebar-overlay";
    document.body.appendChild(o);
    return o;
})();

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    populateSidebarCourses(ACADEMY_COURSES);
    startChatbot();
    setupEventListeners();
});

// Bind Global click handler for Roadmaps (Accordion functionality)
window.toggleRoadmapStep = function(stepElement) {
    // Toggle active class on clicked step
    const isActive = stepElement.classList.contains("active");
    
    // Optional: Close other steps inside same timeline (Accordion)
    const timeline = stepElement.closest(".roadmap-timeline");
    if (timeline) {
        const steps = timeline.querySelectorAll(".roadmap-step");
        steps.forEach(s => s.classList.remove("active"));
    }
    
    if (!isActive) {
        stepElement.classList.add("active");
    }
};

// Populate the sidebar course list
function populateSidebarCourses(coursesToRender) {
    courseList.innerHTML = "";
    coursesToRender.forEach(course => {
        const li = document.createElement("li");
        li.textContent = course;
        
        // Add click listener so clicking sidebar course queries chatbot
        li.addEventListener("click", () => {
            handleSidebarCourseClick(course);
        });
        
        courseList.appendChild(li);
    });
    courseCount.textContent = `${coursesToRender.length} Course${coursesToRender.length !== 1 ? 's' : ''}`;
}

// Start / Restart Chatbot Session
function startChatbot() {
    chatMessages.innerHTML = "";
    currentState = STATES.MAIN_MENU;
    currentQuestionIndex = 0;
    userScores = { coding: 0, mathData: 0, creativity: 0, communication: 0, security: 0, cloud: 0 };
    
    chatInput.disabled = false;
    chatInput.placeholder = "Type a message or click an option...";
    document.querySelector(".chat-footer").style.opacity = "1";
    chatMessages.classList.remove("inactive");

    addBotMessage("Welcome to 21st Academy Career Guidance Assistant <i class=\"fa-solid fa-graduation-cap\"></i>");
    
    setTimeout(() => {
        displayMainMenu();
    }, 600);
}

// Display Main Menu
function displayMainMenu() {
    currentState = STATES.MAIN_MENU;
    const menuHTML = `
        <strong>Main Menu:</strong><br>
        1. Career Assessment Quiz ⭐⭐⭐⭐⭐<br>
        2. Course Recommendations & Roadmaps<br>
        3. Academy Information & Catalog<br>
        4. Contact Details<br>
        5. Exit<br><br>
        <em>Please choose an option (1-5) or type a command.</em>
    `;
    addBotMessage(menuHTML);
    
    setQuickReplies([
        { text: "1. Take Career Quiz", value: "1" },
        { text: "2. View Roadmaps", value: "2" },
        { text: "3. Academy Info", value: "3" },
        { text: "4. Contact Details", value: "4" },
        { text: "5. Exit", value: "5" }
    ]);
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    chatInputForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleUserSubmit();
    });

    restartBtn.addEventListener("click", () => {
        addSystemNotification("Resetting conversation...");
        setTimeout(() => startChatbot(), 300);
    });

    mobileToggle.addEventListener("click", () => {
        sidebar.classList.add("open");
        overlay.style.display = "block";
    });

    const closeSidebarHandler = () => {
        sidebar.classList.remove("open");
        overlay.style.display = "none";
    };

    closeSidebar.addEventListener("click", closeSidebarHandler);
    overlay.addEventListener("click", closeSidebarHandler);

    courseSearch.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = ACADEMY_COURSES.filter(course => 
            course.toLowerCase().includes(query)
        );
        populateSidebarCourses(filtered);
    });
}

// Handle User Input Submission
function handleUserSubmit() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    addUserMessage(text);
    chatInput.value = "";
    
    showTypingIndicator();
    setTimeout(() => {
        removeTypingIndicator();
        processInput(text);
    }, 500);
}

// Process user input based on current state
function processInput(input) {
    const cleanInput = input.toLowerCase().trim();

    // Global override commands
    if (cleanInput === "restart" || cleanInput === "reset") {
        startChatbot();
        return;
    }
    if (cleanInput === "menu" || cleanInput === "main menu") {
        addBotMessage("Returning to the Main Menu.");
        displayMainMenu();
        return;
    }

    // STATE 1: MAIN MENU FLOW
    if (currentState === STATES.MAIN_MENU) {
        if (cleanInput === "1" || cleanInput.includes("quiz") || cleanInput.includes("assessment")) {
            startCareerAssessment();
        } else if (cleanInput === "2" || cleanInput.includes("recommendation") || cleanInput.includes("roadmap")) {
            startCourseRecommendation();
        } else if (cleanInput === "3" || cleanInput.includes("academy") || cleanInput.includes("info") || cleanInput.includes("catalog")) {
            displayAcademyInformation();
        } else if (cleanInput === "4" || cleanInput.includes("contact") || cleanInput.includes("details")) {
            displayContactDetails();
        } else if (cleanInput === "5" || cleanInput.includes("exit")) {
            exitChatbot();
        } else {
            // Keyword match check
            if (!handleKeywords(cleanInput)) {
                addBotMessage("Sorry, I don't understand your question. Please select one of the available options.");
                displayMainMenu();
            }
        }
        return;
    }

    // STATE 2: CAREER ASSESSMENT FLOW
    if (currentState === STATES.CAREER_ASSESSMENT) {
        if (cleanInput === "exit" || cleanInput === "cancel" || cleanInput === "quit") {
            addBotMessage("Quiz cancelled. Returning to the Main Menu.");
            displayMainMenu();
            return;
        }

        // Look for letter input: A, B, C, D, or E
        const matchedLetter = ["a", "b", "c", "d", "e"].find(letter => 
            cleanInput === letter || 
            cleanInput.startsWith(letter + ".") || 
            cleanInput.startsWith(letter + " ") ||
            cleanInput.includes(`option ${letter}`)
        );

        if (matchedLetter) {
            const index = matchedLetter.toUpperCase().charCodeAt(0) - 65; // A=0, B=1...
            const currentQ = ASSESSMENT_QUESTIONS[currentQuestionIndex];
            
            if (index >= 0 && index < currentQ.options.length) {
                // Add score weights
                const chosenOption = currentQ.options[index];
                const weights = chosenOption.weights;
                for (let category in weights) {
                    userScores[category] += weights[category];
                }
                
                // Advance
                currentQuestionIndex++;
                if (currentQuestionIndex < ASSESSMENT_QUESTIONS.length) {
                    askAssessmentQuestion();
                } else {
                    evaluateAssessmentResults();
                }
            } else {
                addBotMessage("Invalid choice. Please select one of the letters provided for this question.");
                renderMCQOptions(currentQ);
            }
        } else {
            // Check keywords first
            if (handleKeywords(cleanInput)) {
                // If keyword, repeat current question after keyword reply
                setTimeout(() => {
                    addBotMessage("Resuming your Career Assessment Quiz:");
                    askAssessmentQuestion();
                }, 1200);
            } else {
                addBotMessage("Please pick a valid option (click a card or type letters A, B, C, D, or E).");
                const currentQ = ASSESSMENT_QUESTIONS[currentQuestionIndex];
                renderMCQOptions(currentQ);
            }
        }
        return;
    }

    // STATE 3: ROADMAP & COURSE RECOMMENDATION SUB-MENU
    if (currentState === STATES.COURSE_RECOMMENDATION) {
        if (cleanInput === "7" || cleanInput.includes("back") || cleanInput.includes("menu")) {
            addBotMessage("Returning to the Main Menu.");
            displayMainMenu();
            return;
        }

        let selectedKey = null;
        if (cleanInput === "1" || cleanInput.includes("ai") || cleanInput.includes("artificial")) {
            selectedKey = "AI_ENGINEER";
        } else if (cleanInput === "2" || cleanInput.includes("full stack") || cleanInput.includes("developer")) {
            selectedKey = "FULL_STACK_DEVELOPER";
        } else if (cleanInput === "3" || cleanInput.includes("cyber security") || cleanInput.includes("networking")) {
            selectedKey = "CYBER_SECURITY_ENGINEER";
        } else if (cleanInput === "4" || cleanInput.includes("cloud") || cleanInput.includes("devops")) {
            selectedKey = "CLOUD_ENGINEER";
        } else if (cleanInput === "5" || cleanInput.includes("business analyst") || cleanInput.includes("analytics")) {
            selectedKey = "BUSINESS_ANALYST";
        } else if (cleanInput === "6" || cleanInput.includes("marketing") || cleanInput.includes("digital")) {
            selectedKey = "DIGITAL_MARKETING_SPECIALIST";
        }

        if (selectedKey) {
            displayCareerRoadmap(selectedKey);
        } else {
            if (!handleKeywords(cleanInput)) {
                addBotMessage("Invalid choice. Please select a number (1-7) or select one of the career pathways below.");
                startCourseRecommendation();
            }
        }
        return;
    }

    // STATE 4: EXITED STATE
    if (currentState === STATES.EXITED) {
        if (cleanInput === "hi" || cleanInput === "hello" || cleanInput.includes("start")) {
            startChatbot();
        } else {
            addBotMessage("Chat session ended. Click 'Restart' or type 'hi' to launch again.");
            setQuickReplies([{ text: "Restart", value: "hi" }]);
        }
    }
}

// --- Keyword Matching Engine ---
function handleKeywords(cleanInput) {
    if (cleanInput === "hi" || cleanInput === "hello" || cleanInput === "hey") {
        addBotMessage("Hello! Welcome to 21st Academy Career Guidance. How can I help you today? Please choose from the options in the menu below or type your question.");
        if (currentState === STATES.MAIN_MENU) displayMainMenu();
        return true;
    }
    
    if (cleanInput.includes("courses") || cleanInput === "course") {
        let listHTML = "<strong>Our Offered Programs (14 Courses):</strong><ul>";
        ACADEMY_COURSES.forEach(c => {
            listHTML += `<li>${c}</li>`;
        });
        listHTML += "</ul><br><em>Tip: You can search these courses anytime in the sidebar directory.</em>";
        addBotMessage(listHTML);
        
        if (currentState === STATES.MAIN_MENU) {
            setTimeout(() => displayMainMenu(), 1000);
        }
        return true;
    }
    
    if (cleanInput.includes("fee") || cleanInput.includes("cost") || cleanInput.includes("price")) {
        addBotMessage("Course fees depend on the training program (e.g. Full Stack vs Data Science). We provide installment patterns and discounts. Call our office at <strong>+91 9944747090</strong> or email <strong>admin@21stacademy.in</strong> for customized pricing quotes.");
        if (currentState === STATES.MAIN_MENU) {
            setTimeout(() => displayMainMenu(), 1000);
        }
        return true;
    }
    
    if (cleanInput.includes("contact") || cleanInput.includes("phone") || cleanInput.includes("email") || cleanInput.includes("website")) {
        displayContactDetails();
        return true;
    }
    
    if (cleanInput.includes("address") || cleanInput.includes("location") || cleanInput.includes("where")) {
        addBotMessage(`<strong>Academy Address:</strong><br>${CONTACT_INFO.address}<br><br>Learn more: <a href="${CONTACT_INFO.website}" target="_blank">${CONTACT_INFO.website}</a>`);
        if (currentState === STATES.MAIN_MENU) {
            setTimeout(() => displayMainMenu(), 1000);
        }
        return true;
    }
    
    if (cleanInput.includes("career") || cleanInput.includes("assessment") || cleanInput.includes("quiz")) {
        addBotMessage("Take our <strong>Career Assessment Quiz</strong> to calculate your scores and generate custom roadmaps. Choose option 1 in the menu!");
        if (currentState === STATES.MAIN_MENU) {
            setTimeout(() => displayMainMenu(), 1000);
        }
        return true;
    }
    
    if (cleanInput.includes("placement") || cleanInput.includes("jobs") || cleanInput.includes("job") || cleanInput.includes("salary")) {
        addBotMessage("21st Academy provides 100% placement support. We feature resume reviews, mock interviews, and organize recruitment drives with MNC partners.");
        if (currentState === STATES.MAIN_MENU) {
            setTimeout(() => displayMainMenu(), 1000);
        }
        return true;
    }
    
    if (cleanInput.includes("training") || cleanInput.includes("class") || cleanInput.includes("learn")) {
        addBotMessage("Our training model is 100% hands-on with live labs. We offer flexible batches (both online live classes and physical classroom batches in Chennai).");
        if (currentState === STATES.MAIN_MENU) {
            setTimeout(() => displayMainMenu(), 1000);
        }
        return true;
    }
    
    return false;
}

// --- Menu Functions ---

// 1. Career Assessment Flow
function startCareerAssessment() {
    currentState = STATES.CAREER_ASSESSMENT;
    currentQuestionIndex = 0;
    userScores = { coding: 0, mathData: 0, creativity: 0, communication: 0, security: 0, cloud: 0 };
    
    addBotMessage("Starting the Career Assessment! I will ask you <strong>10 multiple-choice questions</strong>. Click on options or type letters (A, B, C, D, E). Type 'exit' to cancel.");
    
    setTimeout(() => {
        askAssessmentQuestion();
    }, 800);
}

// Ask MCQ Question
function askAssessmentQuestion() {
    const q = ASSESSMENT_QUESTIONS[currentQuestionIndex];
    addBotMessage(`<strong>Question ${currentQuestionIndex + 1} of 10:</strong><br>${q.question}`);
    
    setTimeout(() => {
        renderMCQOptions(q);
    }, 200);
}

// Render Option Cards in Chat History
function renderMCQOptions(q) {
    const wrapperId = `mcq-wrapper-${currentQuestionIndex}`;
    
    // Clear quick options during questions to focus on MCQ options
    quickOptionsContainer.innerHTML = "";
    
    let mcqHTML = `<div class="mcq-options" id="${wrapperId}">`;
    q.options.forEach(opt => {
        mcqHTML += `
            <button class="mcq-option" data-value="${opt.letter}">
                <span class="option-letter">${opt.letter}</span>
                <span>${opt.text}</span>
            </button>
        `;
    });
    mcqHTML += `</div>`;
    
    addBotMessage(mcqHTML);
    
    // Add Event Listeners to rendered buttons in the chat stream
    setTimeout(() => {
        const mcqWrapper = document.getElementById(wrapperId);
        if (mcqWrapper) {
            const buttons = mcqWrapper.querySelectorAll(".mcq-option");
            buttons.forEach(btn => {
                btn.addEventListener("click", () => {
                    const letter = btn.getAttribute("data-value");
                    chatInput.value = letter;
                    handleUserSubmit();
                });
            });
        }
    }, 100);

    setQuickReplies([
        { text: "Cancel Quiz", value: "exit" }
    ]);
}

// Evaluate Assessment Results & Display Match Recommendation Gauges
function evaluateAssessmentResults() {
    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        
        // Compute Career Fits
        const rawMatches = {
            AI_ENGINEER: userScores.mathData * 1.0 + userScores.coding * 0.4,
            FULL_STACK_DEVELOPER: userScores.coding * 1.0 + userScores.creativity * 0.6,
            CYBER_SECURITY_ENGINEER: userScores.security * 1.0 + userScores.coding * 0.3,
            CLOUD_ENGINEER: userScores.cloud * 1.0 + userScores.coding * 0.3,
            BUSINESS_ANALYST: userScores.communication * 0.8 + userScores.mathData * 0.5,
            DIGITAL_MARKETING_SPECIALIST: userScores.communication * 0.8 + userScores.creativity * 0.6
        };

        // Determine Max Score to normalize
        let maxScore = Math.max(...Object.values(rawMatches));
        if (maxScore === 0) maxScore = 1; // Prevent division by zero
        
        // Scale values to match percentages (top match ~96%, floor at 35%)
        const results = Object.keys(rawMatches).map(key => {
            const raw = rawMatches[key];
            const percent = Math.max(35, Math.round((raw / maxScore) * 96));
            return {
                key: key,
                title: CAREERS[key].title,
                percent: percent
            };
        });

        // Sort by highest match percent
        results.sort((a, b) => b.percent - a.percent);
        const top3 = results.slice(0, 3);
        
        // Render Top 3 Match Gauges
        let resultsHTML = `
            <div class="result-card" style="border: 1px solid var(--secondary);">
                <div class="result-card-title">
                    <i class="fa-solid fa-chart-bar" style="color: var(--secondary);"></i> Your Top Career Matches
                </div>
                <div class="match-container">
        `;
        
        top3.forEach(res => {
            resultsHTML += `
                <div class="match-row">
                    <div class="match-label-row">
                        <span class="match-label">
                            <i class="fa-solid fa-square-poll-horizontal" style="color: var(--primary);"></i> ${res.title}
                        </span>
                        <span class="match-percent">${res.percent}% Fit</span>
                    </div>
                    <div class="match-bar-bg">
                        <div class="match-bar-fill" style="width: ${res.percent}%"></div>
                    </div>
                </div>
            `;
        });
        
        resultsHTML += `
                </div>
            </div>
        `;

        addBotMessage("Assessment complete! Here are your ranked career recommendations based on your scoring vector:");
        addBotMessage(resultsHTML);
        
        // Offer buttons to view roadmaps for top recommendations
        setTimeout(() => {
            addBotMessage(`Choose a pathway below to view its **Step-by-Step Learning Roadmap**:`);
            const roadmapChips = top3.map(res => {
                return { text: `Roadmap: ${res.title}`, value: `Roadmap for ${res.title}` };
            });
            roadmapChips.push({ text: "Main Menu", value: "menu" });
            setQuickReplies(roadmapChips);
            currentState = STATES.COURSE_RECOMMENDATION; // Switch state to handle roadmap clicks
        }, 1200);

    }, 1500);
}

// 2. Start Course Recommendation Sub-menu
function startCourseRecommendation() {
    currentState = STATES.COURSE_RECOMMENDATION;
    const recMenuHTML = `
        <strong>Select a career path to view its Learning Roadmap:</strong><br>
        1. AI Engineer<br>
        2. Full Stack Developer<br>
        3. Cyber Security Engineer<br>
        4. Cloud Engineer<br>
        5. Business Analyst<br>
        6. Digital Marketing Specialist<br>
        7. Back to Main Menu
    `;
    addBotMessage(recMenuHTML);
    
    setQuickReplies([
        { text: "1. AI Engineer", value: "1" },
        { text: "2. Full Stack Dev", value: "2" },
        { text: "3. Cyber Security", value: "3" },
        { text: "4. Cloud Engineer", value: "4" },
        { text: "5. Business Analyst", value: "5" },
        { text: "6. Digital Marketer", value: "6" },
        { text: "Back to Main Menu", value: "7" }
    ]);
}

// Render Interactive Career Roadmap
function displayCareerRoadmap(careerKey) {
    const career = CAREERS[careerKey];
    
    let roadmapHTML = `
        <div class="result-card" style="border-left: 4px solid var(--primary); padding-bottom: 2px;">
            <div class="result-card-title">
                <i class="fa-solid fa-route" style="color: var(--primary);"></i> ${career.title} Roadmap
            </div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 6px 0 12px 0; line-height: 1.4;">
                ${career.desc}
            </p>
            <div class="roadmap-timeline">
    `;

    career.roadmap.forEach((step, idx) => {
        // First step open by default
        const activeClass = idx === 0 ? "active" : "";
        roadmapHTML += `
            <div class="roadmap-step ${activeClass}" onclick="toggleRoadmapStep(this)">
                <div class="roadmap-step-icon">${idx + 1}</div>
                <div class="roadmap-step-header">
                    <h4>${step.phase}</h4>
                    <i class="fa-solid fa-chevron-down toggle-arrow"></i>
                </div>
                <div class="roadmap-step-content">
                    <p>${step.desc}</p>
                    <div class="roadmap-tool-badges">
                        ${step.tools.map(tool => `<span class="roadmap-tool-badge">${tool}</span>`).join("")}
                    </div>
                </div>
            </div>
        `;
    });

    roadmapHTML += `
            </div>
            <div class="result-card-courses" style="margin-top: 14px; border-top: 1px solid var(--border-color); padding-top: 10px;">
                <h4>Academy Core Classes:</h4>
                <div class="course-tags">
                    ${career.courses.map(c => `<span class="course-tag">${c}</span>`).join("")}
                </div>
            </div>
        </div>
    `;

    addBotMessage(`Here is the step-by-step career path for <strong>${career.title}</strong>. Click on any phase header to expand details:`);
    addBotMessage(roadmapHTML);

    setTimeout(() => {
        addBotMessage("Select another roadmap to inspect or return to Main Menu:");
        setQuickReplies([
            { text: "Career Quiz", value: "1" },
            { text: "View Roadmaps", value: "2" },
            { text: "Academy Information", value: "3" },
            { text: "Main Menu", value: "menu" }
        ]);
        currentState = STATES.MAIN_MENU; // Reset state back to main menu
    }, 1500);
}

// 3. Display Academy Information
function displayAcademyInformation() {
    let coursesListHTML = "<ul style='margin-bottom: 12px;'>";
    ACADEMY_COURSES.forEach(c => {
        coursesListHTML += `<li>${c}</li>`;
    });
    coursesListHTML += "</ul>";

    const infoHTML = `
        <strong>21st Academy Information:</strong><br><br>
        <strong>Offered Training Programs:</strong>
        ${coursesListHTML}
        <strong>Academy Address:</strong><br>
        ${CONTACT_INFO.address}<br><br>
        Our syllabus focuses on 100% practical, hands-on labs, certifications alignment, and job training.
    `;
    addBotMessage(infoHTML);
    
    if (currentState === STATES.MAIN_MENU) {
        setTimeout(() => displayMainMenu(), 1500);
    }
}

// 4. Display Contact Details
function displayContactDetails() {
    const contactHTML = `
        <strong>21st Academy Contact Details:</strong><br><br>
        <i class="fa-solid fa-phone" style="color: var(--primary);"></i> <strong>Phone:</strong> <a href="tel:${CONTACT_INFO.phone.replace(/\s+/g, '')}">${CONTACT_INFO.phone}</a><br>
        <i class="fa-solid fa-envelope" style="color: var(--primary);"></i> <strong>Email:</strong> <a href="mailto:${CONTACT_INFO.email}">${CONTACT_INFO.email}</a><br>
        <i class="fa-solid fa-globe" style="color: var(--primary);"></i> <strong>Website:</strong> <a href="${CONTACT_INFO.website}" target="_blank">${CONTACT_INFO.website}</a><br>
        <i class="fa-solid fa-location-dot" style="color: var(--primary);"></i> <strong>Address:</strong> Poonamallee, Chennai (Hayath Plaza, Nambi St.)
    `;
    addBotMessage(contactHTML);
    
    if (currentState === STATES.MAIN_MENU) {
        setTimeout(() => displayMainMenu(), 1200);
    }
}

// 5. Exit Chatbot
function exitChatbot() {
    currentState = STATES.EXITED;
    addBotMessage("Thank you for visiting 21st Academy Career Guidance Assistant! If you want to start again, simply type 'hi' or click 'Restart'.");
    
    chatInput.disabled = true;
    chatInput.placeholder = "Chat session ended. Click Restart to begin.";
    document.querySelector(".chat-footer").style.opacity = "0.6";
    chatMessages.classList.add("inactive");
    
    setQuickReplies([
        { text: "Restart Session", value: "hi" }
    ]);
}

// --- Sidebar Interaction ---
function handleSidebarCourseClick(courseName) {
    // Add user question bubble
    addUserMessage(`Tell me about the ${courseName} course.`);
    
    showTypingIndicator();
    setTimeout(() => {
        removeTypingIndicator();
        
        // Find matching careers for this course
        let matchedCareers = [];
        for (let key in CAREERS) {
            if (CAREERS[key].courses.includes(courseName)) {
                matchedCareers.push(CAREERS[key]);
            }
        }
        
        let reply = `<strong>${courseName}</strong> is one of our key industry-relevant training programs. It is taught 100% practically with live project labs.`;
        
        if (matchedCareers.length > 0) {
            const careersList = matchedCareers.map(c => `<strong>${c.title}</strong>`).join(" and ");
            reply += `<br><br>This course is a core module in our learning pathway for becoming a ${careersList}.`;
            
            addBotMessage(reply);
            
            // Render chips to view the roadmap for the matching career
            setTimeout(() => {
                const chips = matchedCareers.map(c => {
                    return { text: `View ${c.title} Roadmap`, value: `Roadmap for ${c.title}` };
                });
                chips.push({ text: "Main Menu", value: "menu" });
                setQuickReplies(chips);
                currentState = STATES.COURSE_RECOMMENDATION; // Switch state
            }, 800);
        } else {
            reply += `<br><br>We offer personalized certification guidance for this course. Would you like to consult contact details or run the career quiz?`;
            addBotMessage(reply);
            
            setTimeout(() => {
                setQuickReplies([
                    { text: "Take Career Quiz", value: "1" },
                    { text: "Contact Details", value: "4" },
                    { text: "Main Menu", value: "menu" }
                ]);
            }, 800);
        }
        
        // If sidebar was open in mobile, close it
        sidebar.classList.remove("open");
        overlay.style.display = "none";
        
    }, 600);
}

// --- UI Messaging Helpers ---

// Add a Bot Message bubble
function addBotMessage(htmlContent) {
    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper bot";
    
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.innerHTML = htmlContent;
    
    const timeSpan = document.createElement("span");
    timeSpan.className = "timestamp";
    timeSpan.textContent = getCurrentTime();
    bubble.appendChild(timeSpan);
    
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
}

// Add a User Message bubble
function addUserMessage(text) {
    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper user";
    
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = text;
    
    const timeSpan = document.createElement("span");
    timeSpan.className = "timestamp";
    timeSpan.textContent = getCurrentTime();
    bubble.appendChild(timeSpan);
    
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
}

// Add a System notification bubble
function addSystemNotification(text) {
    const notif = document.createElement("div");
    notif.style.textAlign = "center";
    notif.style.fontSize = "0.75rem";
    notif.style.color = "var(--text-muted)";
    notif.style.margin = "8px 0";
    notif.innerHTML = `<i class="fa-solid fa-info-circle"></i> ${text}`;
    chatMessages.appendChild(notif);
    scrollToBottom();
}

// Set Quick Reply Chips
function setQuickReplies(options) {
    quickOptionsContainer.innerHTML = "";
    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-chip";
        btn.innerHTML = `${opt.text} <i class="fa-solid fa-chevron-right"></i>`;
        btn.addEventListener("click", () => {
            chatInput.value = opt.value;
            handleUserSubmit();
        });
        quickOptionsContainer.appendChild(btn);
    });
}

// Typing Indicator Helpers
function showTypingIndicator() {
    removeTypingIndicator(); // Ensure no duplicates
    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper bot";
    wrapper.id = "typingIndicatorWrapper";
    
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    
    const indicator = document.createElement("div");
    indicator.className = "typing-indicator";
    indicator.innerHTML = `
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
    `;
    
    bubble.appendChild(indicator);
    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    scrollToBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById("typingIndicatorWrapper");
    if (indicator) {
        indicator.remove();
    }
}

// Scroll to bottom helper
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Time formatter (HH:MM AM/PM)
function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
}
