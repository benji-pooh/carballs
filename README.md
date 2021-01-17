# Car Football Game - WebGL

## Opis projektu

W ramach projektu zrealizowaliśmy w technologii WebGL dwuosobową grę przeglądarkową, w ramach której gracze sterując samochodami próbują trafić piłką do bramki przeciwnika.

Inspiracją dla projektu była produkcja Rocket League, która, choć znacznie bardziej zaawansowana, opieraja się na podobnej koncepcji rozgrywki.

Gracze mają możliwość pełnego sterowania samochodem za pomocą klawiatury lub kontrolera do gier (testowany na Dualshock 3).

Aby gra była ciekawsza, samochody mają możliwości podskoku, a gracze mogą ustawić pojazdy z powrotem na kółkach, jeżeli samochód przewróci się. Pełna instrukcja sterowania znajduje się w lewym dolnym rogu ekranu.

Po trafieniu piłką do bramki przeciwnika, stan punktowy meczu ulega zmianie, a punkty są wyświelane na tablicy wyników w górnej części strony.

## Link do strony z projektem

[Strona z grą](https://def-au1t.github.io/car-football/)

## Opis techniczny

Kod skryptu odpowiedzialnego za generowanie planszy znajduje się w pliku `js/script.js`.


### Obiekty 3D

W projekcie użyliśmy modeli w formacie `.json` ładowanych przez bibliotekę three.js. Zostały one wygenerowane przy pomocy programu Blender i wyesportowane w taki, sposób, aby możlwiy był ich poprawny odczyt z pliku tekstowego.

Z racji ograniczonych możliwości sprzętowych, skorzystaliśmy z trójwymiarowych modeli low-poly drzew, aby rozgrywka była możliwie płynna. Elementy stanowiące granicę boiska zostały przez nas stworzone ręcznie w Blenderze i wyeksportowane.

Uznaliśmy, że dodanie tekstury papieru na podłoże sprawi, że w połączeniu z zaimportowanymi modelami samochodów, gra będzie miała - popularny obecnie - rysunkowy charakter.

### Kamera

Zastowowaliśmy kamerę perspektywiczną (`PerspectiveCamera`), która podąża za punktem  pomiędzy dwoma graczami, a jej odległość zmienia się w zależności od położenia graczy na planszy.


### Światło

W programie zostały użyte dwa źródła światła:

- `HemisphereLight` - odpowiada za ogólną jasność całej sceny
- `DirectionalLight` - dodaje cienie i mocniejsze oświetlenie od strony "słońca"

### Fizyka

Elementy fizycznie są obliczane na dwa sposoby:
- `ConvexMesh` - samochody - jest to dość obciążające obliczeniowo
- `BoxMesh/SphereMesh` - mniejsza (lecz wystarczająca) dokładność piłki i ograniczników planszy

### Użyte technologie i biblioteki

- Biblioteki Three.js & Physi.js
- Modele wygenerowane za pomocą programu Blender
- Biblioteka GameController do obsługi sterowania kontrolerem.


### Tryb debugowania

Po otwarciu strony z parametrem `?debug` w adresie, dostępne są statystyki wyświetlania klatek na sekundę, oraz panel z ustawieniami fizyki, które można zmieniać w czasie gry.

[Strona z grą - tryb debugowania (z parametrami i licznikiem FPS)](https://def-au1t.github.io/car-football/?debug)

## Sterowanie w grze

Pomiższy diagram prezentuje

![](docs/controls.png)

## Zrzuty ekranu

### Ekran rozgrywki
![](docs/img1.png)

### Zdobycie punku sygnalizowane kolorem
![](docs/img2.png)


## Autorzy:

- Karol Musur
- Jacek Nitychoruk


