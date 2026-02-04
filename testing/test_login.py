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
    print_status("Navigating to Login Page...", "INFO")
    driver.get("http://localhost:3000/auth/login")
    time.sleep(2) 

    try:
        header = driver.find_element(By.XPATH, "//h1[contains(text(), 'Welcome Back')]")
        print_status("Login Page Loaded Successfully", "SUCCESS")
    except:
        print_status("Login Page Load Failed", "ERROR")
        driver.quit()
        exit()


    print_status("Attempting Login...", "INFO")
    

    email = "smahmud223009@bscse.uiu.ac.bd"
    password = "123456" 

    driver.find_element(By.CSS_SELECTOR, "input[type='email']").send_keys(email)
    driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(password)
    time.sleep(1)
    

    driver.find_element(By.XPATH, "//button[contains(text(), 'Sign In')]").click()
    
    time.sleep(5)

    
    current_url = driver.current_url
    if "/dashboard" in current_url:
        print_status("Login Successful! Redirected to Dashboard or Post-Login Page.", "SUCCESS")
    elif "login" in current_url:
        
        try:
            error_msg = driver.find_element(By.CLASS_NAME, "bg-red-50").text
            print_status(f"Login Failed (Expected with invalid creds): {error_msg}", "INFO")
        except:
             print_status("Login Attempted but remained on login page without clear error.", "INFO")
    else:
        print_status(f"Unknown State. Current URL: {current_url}", "INFO")

except Exception as e:
    print_status(f"An exception occurred: {e}", "ERROR")

finally:
    print_status("Test Completed.", "INFO")
   
