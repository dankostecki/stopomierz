import requests
from bs4 import BeautifulSoup
import json

URL = "https://stooq.pl/q/?s=plopln3m"
OUT = "wibor_rates.json"

def main():
    resp = requests.get(URL)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    # span z id="aq_plopln3m_c2" trzyma aktualny kurs
    span = soup.find("span", id="aq_plopln3m_c2")
    if not span:
        raise RuntimeError("Nie znaleziono wartości WIBOR 3M na stooq.pl")
    value = span.get_text(strip=True)

    # Zapisujemy do JSON
    data = {
        "timestamp": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "wibor_3m": value
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
