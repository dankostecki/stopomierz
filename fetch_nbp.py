import requests
import xml.etree.ElementTree as ET
import json

# URL do XML-a z podstawowymi stopami
URL = "https://static.nbp.pl/dane/stopy/stopy_procentowe.xml"

def main():
    # 1) Pobierz XML
    resp = requests.get(URL)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)

    # 2) Odczytaj datę publikacji
    date_pub = root.attrib.get("data_publikacji")

    # 3) Sparsuj pozycje
    rates = {"data_publikacji": date_pub}
    for pozycja in root.findall(".//pozycja"):
        nazwa = pozycja.attrib.get("nazwa")               # np. "Stopa referencyjna"
        oprocent = pozycja.attrib.get("oprocentowanie")  # np. "5,75"
        if nazwa and oprocent:
            rates[nazwa] = oprocent

    # 4) Zapisz do JSON-a
    with open("nbp_rates.json", "w", encoding="utf-8") as f:
        json.dump(rates, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
