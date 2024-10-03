import os
import time
import logging
import asyncio
from PIL import Image
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from telegram import Bot
from anticaptchaofficial.imagecaptcha import *
from dotenv import load_dotenv
from twilio.rest import Client
import datetime
import sys

# Load environment variables from .env file
dotenv_path = "/Users/I338058/PythonCode/ukr/.env"
load_dotenv(dotenv_path=dotenv_path)

# Constants
debug = 0
try_times = 3
top = 0
TELEGRAM_BOT_TOKEN = os.getenv("telegram_bot_token")
TELEGRAM_CHAT_ID = os.getenv("telegram_chat_id")
ANTICAPTCHA_KEY = os.getenv("anticapcha_id")
twilio_sid = os.getenv("twilio_sid")
twilio_tocken = os.getenv("twilio_tocken")
twilio_phone_number = os.getenv("twilio_phone_number")
MY_phone_number = os.getenv("my_phone_number")
CAPTCHA_FAIL_SHORT = "Le code de sécurité saisi est incorrect"
TEMP_FILES_PATH = "/Users/I338058/PythonCode/ukr/tmp/"
URL = "https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/1904/cgu/"
call_url = (
    "https://drive.google.com/file/d/1HTvM-eCsqt8XdEX8GBqNS6c6_UPITAQO/view?usp=sharing"
)
expected_width = 1024  # Change based on your needs
expected_height = 768  # Change based on your needs
scrol_pixel = 3017

# Configure logging
LOG_FILE_PATH = os.path.join(TEMP_FILES_PATH, "script.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE_PATH),
        logging.StreamHandler(),
    ],
)

# Initialize Telegram Bot
bot = Bot(token=TELEGRAM_BOT_TOKEN)
# Initialize Twilio client
client = Client(twilio_sid, twilio_tocken)

# Initialize Chrome WebDriver options
options = webdriver.ChromeOptions()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--disable-gpu")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument(f"window-size={expected_width},{expected_height}")


async def send_telegram_message(message):
    max_message_length = 4096  # Telegram API message length limit
    chunks = [
        message[i : i + max_message_length]
        for i in range(0, len(message), max_message_length)
    ]
    for chunk in chunks:
        await bot.send_message(chat_id=TELEGRAM_CHAT_ID, text=chunk)


async def send_telegram_img(image_path):
    with open(image_path, "rb") as img_file:
        await bot.send_photo(chat_id=TELEGRAM_CHAT_ID, photo=img_file)


def save_text_if_different(file_path, new_text):
    """Save the new text to the file only if it's different from the last line."""
    last_line = ""
    if os.path.exists(file_path):
        with open(file_path, "r") as file:
            lines = file.readlines()
            if lines:
                last_line = lines[-1].strip()

    if last_line != new_text:
        with open(file_path, "a") as file:
            file.write(new_text + "\n")
        logging.info("Text appended to file.")
    else:
        logging.info("Text is the same as the last line. No changes made.")
    return last_line


def solve_captcha(image_path):
    """Solve the captcha using the anticaptcha service."""
    solver = imagecaptcha()
    solver.set_verbose(1)
    solver.set_key(ANTICAPTCHA_KEY)
    solver.set_soft_id(1202)
    captcha_text = solver.solve_and_return_solution(image_path)
    if captcha_text != "ERROR_CAPTCHA_UNSOLVABLE":
        logging.info(f"Captcha solved: {captcha_text}")
        return captcha_text, solver
    else:
        logging.error("Failed to solve captcha.")
        return None


def get_driver():
    """Initialize and return a Chrome WebDriver."""
    chromedriver_path = "/opt/homebrew/bin/chromedriver"
    return webdriver.Chrome(service=Service(chromedriver_path), options=options)


def capture_screenshot(driver, file_name):
    """Capture and save a screenshot."""
    screenshot_path = os.path.join(TEMP_FILES_PATH, file_name)
    driver.save_screenshot(screenshot_path)
    # Open the saved screenshot and check its dimensions
    image = Image.open(screenshot_path)
    width, height = image.size

    # Check if the screenshot size is larger than the expected size (Retina case)
    if width > expected_width or height > expected_height:
        print(f"Screenshot size is {width}x{height}. Resizing is needed.")

        # Resize the image
        scale_factor = width / expected_width  # Assuming proportional scaling
        scaled_image = image.resize((expected_width, int(height / scale_factor)))
        scaled_image.save(screenshot_path)

    return screenshot_path


def crop_captcha_image(image_path, left, ruight, bottom):
    """Crop the captcha from the screenshot."""
    img = Image.open(image_path)
    cropped_img = img.crop(
        (left - 3, top, ruight + 3, bottom + top + 3)
    )  # *2 is scaling factor for mac retina
    captcha_path = os.path.join(TEMP_FILES_PATH, "captcha_raw.png")
    cropped_img.save(captcha_path)
    return captcha_path


# Function to make a call
def make_call(to_number):
    call = client.calls.create(
        to=to_number,  # The phone number to call (in E.164 format, e.g., +1234567890)
        from_=twilio_phone_number,  # Your Twilio phone number
        url=call_url,  # A URL to TwiML instructions for the call
    )
    return call.sid


async def main():

    # Get the current day of the week (0=Monday, 6=Sunday)
    current_day = datetime.datetime.now().weekday()

    # If it's Saturday (5) or Sunday (6), exit the script
    if current_day >= 5:
        print("I am not working now, i`m French")
        logging.info("I am not working now, i`m French")
        sys.exit()

    try_i = 0  # will be rerun with os
    tr_txt = ""

    while try_i < try_times and (CAPTCHA_FAIL_SHORT in tr_txt or not tr_txt):
        try_i += 1
        logging.info(f"Attempt: {try_i}")

        driver = get_driver()
        driver.get(URL)

        # Scroll and wait
        driver.execute_script(f"window.scrollBy(0, {scrol_pixel});")
        time.sleep(2)

        # Capture captcha image
        screenshot_path = capture_screenshot(driver, "screenshot.png")
        img_element = driver.find_element(By.ID, "captchaFR_CaptchaImage")
        location = img_element.location
        size = img_element.size
        left = location["x"]
        right = left + size["width"]
        bottom = size["height"]
        captcha_path = crop_captcha_image(screenshot_path, left, right, bottom)

        # Solve captcha
        # Submit the CAPTCHA for solving and get the task_id
        if debug != 1:
            captcha_text, solver = solve_captcha(captcha_path)  # This cost money =(
        else:
            captcha_text = "12345678"

        # Submit form
        text_field = driver.find_element(By.ID, "captchaFormulaireExtInput")
        text_field.send_keys(captcha_text)

        button = driver.find_element(By.XPATH, "//button[@type='submit']")
        button.click()

        if "_choisirBloc" in driver.current_url:
            # There are places!!!!!
            text = "!Oh lala there are places go grab them!!!!"
            screenshot_f_path = capture_screenshot(driver, "screenshot_failed.png")
            await send_telegram_message(text)
            await send_telegram_img(screenshot_f_path)
            logging.info(text)
            page_source = driver.page_source
            file = open(TEMP_FILES_PATH + "out.html", "w", encoding="utf-8")
            file.write(page_source)
            try_i = try_times + 1
            make_call(MY_phone_number)
        else:
            # Check if the element exists by finding it
            elements = driver.find_elements(By.ID, "text-input-captcha-desc-error")
            if elements:
                # Captcha error
                tr_txt = elements[0].text
                if captcha_text.lower() == "blank" or captcha_text.lower() == "empty":
                    # Captcha is blanked
                    text = f"Seems Captcha is blanked: {captcha_text}"
                    print(text)
                    logging.error(text)
                    await send_telegram_img(captcha_path)
                    await send_telegram_message(text)
                elif debug != 1:
                    text = f"Captcha failed: {captcha_text}"
                    print(text)
                    logging.error(text)
                    screenshot_f_path = capture_screenshot(
                        driver, "screenshot_failed.png"
                    )
                    page_source = driver.page_source
                    file = open(TEMP_FILES_PATH + "out.html", "w", encoding="utf-8")
                    file.write(page_source)
                    if captcha_text != "12345678":
                        solver.report_incorrect_image_captcha()
                        text = "Captcha reported!!"
                        print(text)
                        logging.error(text)

            else:
                parent_divs = driver.find_elements(
                    By.CSS_SELECTOR, "div.text-center.q-pa-md"
                )
                # Check if the parent div exists and contains the desired spans
                if len(parent_divs) > 0:
                    parent_div = parent_divs[1]

                    # Check if the bold span exists
                    bold_text_elements = parent_div.find_elements(
                        By.CSS_SELECTOR, "span.fr-text--italic.fr-text--bold"
                    )
                    if len(bold_text_elements) > 0:
                        bold_text = bold_text_elements[0].text
                        # Check if the italic (non-bold) span exists
                    else:
                        print("Bold italic text not found.")
                        logging.info("Bold italic text not found.")

                    italic_text_elements = parent_div.find_elements(
                        By.CSS_SELECTOR, "span.fr-text--italic:not(.fr-text--bold)"
                    )
                    if len(italic_text_elements) > 0:
                        italic_text = italic_text_elements[0].text
                    else:
                        print("Italic (non-bold) text not found.")
                        logging.info("Italic (non-bold) text not found.")
                    if (
                        len(italic_text_elements) > 0
                        and italic_text_elements[0].text.strip()
                        and len(bold_text_elements) > 0
                        and bold_text_elements[0].text.strip()
                    ):
                        text = bold_text + " " + italic_text
                        last_text = save_text_if_different(
                            os.path.join(TEMP_FILES_PATH, "update.log"), text
                        )
                        logging.info("No free places: " + text)
                        if last_text != text:
                            await send_telegram_message("There was an update: " + text)
                    else:
                        # something else?
                        text = "?Seems there are places go grab them?"
                        screenshot_f_path = capture_screenshot(
                            driver, "screenshot_failed.png"
                        )
                        await send_telegram_message(text)
                        await send_telegram_img(screenshot_f_path)
                        logging.info(text)
                        page_source = driver.page_source
                        file = open(TEMP_FILES_PATH + "out.html", "w", encoding="utf-8")
                        file.write(page_source)
                        make_call(MY_phone_number)
                    try_i = try_times + 1
                else:
                    # something else?
                    text = "?Seems there are places go grab them?"
                    screenshot_f_path = capture_screenshot(
                        driver, "screenshot_failed.png"
                    )
                    await send_telegram_message(text)
                    await send_telegram_img(screenshot_f_path)
                    logging.info(text)
                    page_source = driver.page_source
                    file = open(TEMP_FILES_PATH + "out.html", "w", encoding="utf-8")
                    file.write(page_source)
                    try_i = try_times + 1
                    make_call(MY_phone_number)
    driver.quit()

    if try_i == try_times and debug != 1:
        # Captcha incorrect N times
        text = f"Captcha was incorrect {try_times} times: {captcha_text}"
        print(text)
        logging.error(text)
        await send_telegram_img(captcha_path)
        await send_telegram_message(text)


if __name__ == "__main__":
    asyncio.run(main())
