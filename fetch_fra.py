import json
import requests
from bs4 import BeautifulSoup

URLS = {
    "1x4": "https://www.patria.cz/kurzy/PLN/1x4/fra/graf.html",
    "3x6": "https://www.patria.cz/kurzy/PLN/3x6/fra/graf.html",
    "6x9": "https://www.patria.cz/kurzy/PLN/6x9/fra/graf.html",
    "9x12": "https://www.patria.cz/kurzy/PLN/9x12/fra/graf.html",
}

def scrape_value(url):
    resp = requests.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")
    label = soup.find("td", class_="label", string="Aktuální hodnota")
    if not label:
        return None
    val_td = label.find_next_sibling("td", class_="value")
    return val_td.text.strip() if val_td else None

def main():
    data = {period: scrape_value(url) for period, url in URLS.items()}
    with open("fra_rates.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
