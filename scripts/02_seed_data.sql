-- Seed user_profiles data (demo user)
INSERT INTO user_profiles (user_id, name, email, major, bio, desired_role, profile_completion_percentage) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Alex Rodriguez',
    'alex.rodriguez@example.com',
    'Computer Science',
    'Passionate about software development and AI. Currently exploring full-stack development and machine learning.',
    'Full Stack Developer',
    75
  );

-- Seed user_skills data (demo user skills)
INSERT INTO user_skills (user_id, skill_name, proficiency_level) VALUES
  ('00000000-0000-0000-0000-000000000001', 'JavaScript', 85),
  ('00000000-0000-0000-0000-000000000001', 'React', 80),
  ('00000000-0000-0000-0000-000000000001', 'Node.js', 75),
  ('00000000-0000-0000-0000-000000000001', 'Python', 70),
  ('00000000-0000-0000-0000-000000000001', 'SQL', 65),
  ('00000000-0000-0000-0000-000000000001', 'Docker', 60);

-- Seed job_matches data
INSERT INTO job_matches (user_id, job_title, company_name, match_percentage, required_skills) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Frontend Developer',
    'Tech Solutions Inc.',
    92,
    ARRAY['JavaScript', 'React', 'CSS', 'HTML']
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Full Stack Engineer',
    'Digital Innovations',
    88,
    ARRAY['JavaScript', 'Node.js', 'React', 'MongoDB']
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Backend Developer',
    'Cloud Services Co.',
    75,
    ARRAY['Node.js', 'Python', 'Docker', 'AWS']
  );

-- Seed courses data
INSERT INTO courses (user_id, course_title, provider, price, is_free) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Advanced React Patterns',
    'Udemy',
    49.99,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Docker for Developers',
    'Coursera',
    0.00,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Python Data Structures',
    'edX',
    79.99,
    false
  );

-- Seed notifications data
INSERT INTO notifications (user_id, notification_type, title, description, is_read) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'job_match',
    'New Job Match!',
    'You have a 92% match with Frontend Developer at Tech Solutions Inc.',
    false
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'course_recommendation',
    'Course Recommendation',
    'Based on your skills, we recommend "Advanced React Patterns"',
    false
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'skill_update',
    'Skill Progress',
    'Your JavaScript proficiency has increased to 85%',
    true
  );

-- Seed ai_skill_suggestions data
INSERT INTO ai_skill_suggestions (user_id, skill_name, suggestion_text, course_recommendation, suggestion_type) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'TypeScript',
    'Learning TypeScript will enhance your JavaScript development and make you more competitive for modern web development roles.',
    'TypeScript: The Complete Developer''s Guide',
    'skill_gap'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'AWS',
    'Cloud computing skills are highly valued. AWS certification would complement your backend development skills.',
    'AWS Certified Developer Associate',
    'career_advancement'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'GraphQL',
    'GraphQL is becoming increasingly popular for API development. It pairs well with your React and Node.js skills.',
    'GraphQL with React: The Complete Developers Guide',
    'trending_skill'
  );

-- Seed features data
INSERT INTO features (name, description, icon, order_index) VALUES
  (
    'Skill-Gap Radar',
    'Visualize your strengths and weaknesses with our visual radar chart analysis.',
    'radar',
    1
  ),
  (
    'AI Job Matching',
    'Connect your skills to roles using our intelligent matching algorithm.',
    'briefcase',
    2
  ),
  (
    'Teacher-Student Collaboration',
    'Share goals, track progress, and receive targeted feedback in a collaborative space.',
    'users',
    3
  ),
  (
    'Industry Integration',
    'Align your skills with real-world industry standards and employer demands.',
    'trending-up',
    4
  );

-- Seed testimonials data
INSERT INTO testimonials (name, title, role, image_url, quote) VALUES
  (
    'Alex Johnson',
    'Alex Johnson, University Student',
    'Student',
    '/placeholder.svg?height=200&width=200',
    'Skill+ gave me the clarity I needed. I realized exactly which skills I was missing for my dream role. It''s a game-changer for students like me actually looking to develop themselves!'
  ),
  (
    'Dr. Samantha Lee',
    'Dr. Samantha Lee, Professor',
    'Professor',
    '/placeholder.svg?height=200&width=200',
    'I can finally provide data-driven feedback to my students. Skill+ helps me identify exactly where they need support and guides them towards success. Teaching has become so much more effective!'
  ),
  (
    'David Chen',
    'David Chen, Tech Recruiter',
    'Recruiter',
    '/placeholder.svg?height=200&width=200',
    'Finding qualified talent has never been a bigger challenge. Skill+ helps me identify candidates with key skill gaps and potential for roles. It''s a win-win for everyone involved.'
  );
