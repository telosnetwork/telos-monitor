CREATE TABLE task_categories (id SERIAL PRIMARY KEY, name VARCHAR(125));
CREATE TABLE tasks (id SERIAL PRIMARY KEY, name VARCHAR(255), category INT NOT NULL, FOREIGN KEY(category) REFERENCES task_categories(id));
CREATE TABLE task_status_type(id SERIAL PRIMARY KEY, name VARCHAR(125));
CREATE TABLE task_status(id SERIAL PRIMARY KEY, task INT NOT NULL, checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, message VARCHAR(255), type INT NOT NULL, FOREIGN KEY (task) REFERENCES tasks(id), FOREIGN KEY (type) REFERENCES task_status_type(id));
INSERT INTO task_status_type (name) VALUES ('success'), ('info'), ('alert'), ('error');