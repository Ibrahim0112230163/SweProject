from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
import time


def print_status(message, status="INFO"):
    colors = {
        "INFO": "\033[94m",    
        "SUCCESS": "\033[92m", 
        "ERROR": "\033[91m",   
        "RESET": "\033[0m"     
    }
    print(f"{colors.get(status, '')}[{status}] {message}{colors['RESET']}")

service_obj = Service()
options = webdriver.EdgeOptions()
options.add_experimental_option("detach", True)

driver = webdriver.Edge(options=options, service=service_obj)
driver.maximize_window()

try:

    print_status("Navigating to Login Page for Analyzer Test...", "INFO")
    driver.get("http://localhost:3000/auth/login")
    time.sleep(2)

    email = "smahmud223009@bscse.uiu.ac.bd"
    password = "123456"

    driver.find_element(By.CSS_SELECTOR, "input[type='email']").send_keys(email)
    driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(password)
    time.sleep(1)
    driver.find_element(By.XPATH, "//button[contains(text(), 'Sign In')]").click()
    
    time.sleep(5) 

  
    print_status("Navigating to Analyzer Feature...", "INFO")
    driver.get("http://localhost:3000/dashboard/analyzer")
    time.sleep(3)

 
    try:
  
        header = driver.find_element(By.XPATH, "//h1[contains(text(), 'Syllabus Analyzer')]")
        print_status("Analyzer Page Loaded Successfully", "SUCCESS")
        
      
        driver.find_element(By.XPATH, "//button[contains(text(), 'Analyze Text')]")
        print_status("Analyze Button Found", "SUCCESS")
        
    except Exception as e:
        print_status(f"Analyzer Page Validation Failed: {e}", "ERROR")

except Exception as e:
    print_status(f"An exception occurred: {e}", "ERROR")

finally:
    print_status("Analyzer Test Completed.", "INFO")
