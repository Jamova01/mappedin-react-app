import {
  MappedinLocation,
  MappedinMap,
  TGetVenueOptions,
} from "@mappedin/mappedin-js";
import "@mappedin/mappedin-js/lib/mappedin.css";
import { useEffect, useMemo, useRef, useState } from "react";
import useMapView from "./../../hooks/useMapView";
import useVenue from "./../../hooks/useVenue";
import useOfflineSearch from "../../hooks/useOfflineSearch";
import useSelectedLocation from "../../hooks/useSelectedLocation";
import useWayfinding from "../../hooks/useWayfinding";

import {
  ArrowTurnUpLeftIcon,
  ArrowTurnUpRightIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

function Home() {
  const options = useMemo<TGetVenueOptions>(
    () => ({
      venue: "mappedin-demo-mall",
      clientId: "5eab30aa91b055001a68e996",
      clientSecret: "RJyRXKcryCMy4erZqqCbuB1NbR66QTGNXVE0x3Pg6oCIlUR1",
    }),
    []
  );

  const venue = useVenue(options);
  const { elementRef, mapView } = useMapView(venue);
  const {
    startLocation,
    endLocation,
    setStartLocation,
    setEndLocation,
    clearAll,
    distance,
    steps,
  } = useWayfinding(mapView);

  const [searchQueryStart, setSearchQueryStart] = useState("");
  const [searchQueryEnd, setSearchQueryEnd] = useState("");
  const { setSelectedLocation } = useSelectedLocation(mapView);
  const [maps, setMaps] = useState<MappedinMap[]>([]);

  const resultsStart = useOfflineSearch(venue, searchQueryStart);
  const resultsEnd = useOfflineSearch(venue, searchQueryEnd);

  const searchResultsStart = useMemo(
    () =>
      resultsStart
        .filter((result) => result.type === "MappedinLocation")
        .map((result) => (
          <div
            id="search-result"
            key={(result.object as MappedinLocation).name}
            onClick={() => {
              const location = result.object as MappedinLocation;
              setSelectedLocation(location);
              setStartLocation(location);
              setSearchQueryStart("");
            }}
            className="cursor-pointer p-2 hover:bg-gray-700 rounded"
          >
            {`${result.object.name}`}
          </div>
        )),
    [resultsStart, setSelectedLocation, setStartLocation]
  );

  const searchResultsEnd = useMemo(
    () =>
      resultsEnd
        .filter((result) => result.type === "MappedinLocation")
        .map((result) => (
          <div
            id="search-result"
            key={(result.object as MappedinLocation).name}
            onClick={() => {
              const location = result.object as MappedinLocation;
              setSelectedLocation(location);
              setEndLocation(location);
              setSearchQueryEnd("");
            }}
            className="cursor-pointer p-2 hover:bg-gray-700 rounded"
          >
            {`${result.object.name}`}
          </div>
        )),
    [resultsEnd, setSelectedLocation, setEndLocation]
  );

  const mapGroupSelectRef = useRef<HTMLSelectElement>(null);
  const mapLevelSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    mapView?.addInteractivePolygonsForAllLocations();
    mapView?.FloatingLabels.labelAllLocations();

    const populateMaps = (maps: MappedinMap[]) => {
      if (mapLevelSelectRef.current) {
        mapLevelSelectRef.current.innerHTML = "";
        mapLevelSelectRef.current.onchange = onLevelChange;
        maps.forEach((map) => {
          const option = document.createElement("option");
          option.text = map.name;
          option.value = map.id;
          mapLevelSelectRef.current?.add(option);
        });
        mapLevelSelectRef.current.value = mapView?.currentMap.id || "";
      }
    };

    const populateMapGroups = () => {
      if (mapGroupSelectRef.current) {
        mapGroupSelectRef.current.innerHTML = "";
        venue?.mapGroups.forEach((mg) => {
          const option = document.createElement("option");
          option.value = mg.id;
          option.text = mg.name;
          mapGroupSelectRef.current?.appendChild(option);
        });
        const maps =
          venue?.mapGroups[0]?.maps.sort((a, b) => b.elevation - a.elevation) ||
          [];
        setMaps(maps);
        populateMaps(maps);
      }
    };

    const onLevelChange = (event: Event) => {
      const id = (event.target as HTMLSelectElement).value;
      mapView?.setMap(id);
    };

    mapGroupSelectRef.current?.addEventListener(
      "change",
      async (event: Event) => {
        const mg = venue?.mapGroups.find(
          (mg) => mg.id === mapGroupSelectRef.current?.value
        );
        if (mg) {
          const maps = mg.maps.sort((a, b) => b.elevation - a.elevation);
          const map = maps[maps.length - 1];
          await mapView?.setMap(map);
          setMaps(maps);
        }
      }
    );

    populateMapGroups();
  }, [mapView, venue]);

  return (
    <section className="flex flex-col h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 p-4 flex justify-between items-center h-16">
        <div className="flex items-center">
          <select
            ref={mapGroupSelectRef}
            className="bg-gray-700 text-white p-2 rounded mr-2"
          >
            {venue?.mapGroups.map((mg) => (
              <option key={mg.id} value={mg.id}>
                {mg.name}
              </option>
            ))}
          </select>
          <select
            ref={mapLevelSelectRef}
            className="bg-gray-700 text-white p-2 rounded"
          >
            {maps.map((mp) => (
              <option key={mp.id} value={mp.id}>
                {mp.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={clearAll}
          className="flex items-center bg-red-500 text-white p-2 rounded"
        >
          <TrashIcon className="w-5 h-5 mr-2" />
          Clear Route
        </button>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <aside className="bg-gray-800 w-64 p-4 overflow-y-auto">
          <div className="mb-4">
            <label className="block mb-2">Start Location</label>
            <div className="flex">
              <input
                value={startLocation?.name || ""}
                readOnly
                className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"
              />
            </div>
            <input
              type="text"
              placeholder="Search for start location"
              value={searchQueryStart}
              onChange={(e) => {
                setSearchQueryStart(e.target.value);
              }}
              className="w-full p-2 mt-2 bg-gray-700 text-white border border-gray-600 rounded"
            />
            <div className="search-results mt-2">{searchResultsStart}</div>
          </div>

          <div className="mb-4">
            <label className="block mb-2">End Location</label>
            <div className="flex">
              <input
                value={endLocation?.name || ""}
                readOnly
                className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded"
              />
            </div>
            <input
              type="text"
              placeholder="Search for end location"
              value={searchQueryEnd}
              onChange={(e) => {
                setSearchQueryEnd(e.target.value);
              }}
              className="w-full p-2 mt-2 bg-gray-700 text-white border border-gray-600 rounded"
            />
            <div className="search-results mt-2">{searchResultsEnd}</div>
          </div>

          {distance !== undefined && (
            <div className="mb-4">
              <label className="block mb-2">Route Information</label>
              <div className="bg-gray-700 text-white p-2 rounded border border-gray-600">
                <p>Distance: {distance.toFixed(2)} meters</p>
              </div>
            </div>
          )}

          {steps && (
            <div className="mb-4">
              <label className="block mb-2">Instructions</label>
              <ul className="bg-gray-700 text-white p-2 rounded border border-gray-600 space-y-2">
                {steps.map((step, index) => (
                  <li
                    key={index}
                    className="flex gap-2 p-2 bg-gray-800 border border-gray-600 rounded cursor-pointer hover:bg-gray-700"
                    onClick={() => console.log(step)}
                  >
                    <div className="flex justify-center items-center">
                      {step.instruction === "Turn left" && (
                        <ArrowTurnUpLeftIcon className="w-6 h-6" />
                      )}
                      {step.instruction === "Turn right" && (
                        <ArrowTurnUpRightIcon className="w-6 h-6" />
                      )}
                      {step.instruction === "Arrive at destination" && (
                        <MapPinIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold">
                        {step.instruction}
                      </p>
                      <p className="text-xs font-normal">
                        {Math.round(step.distance)} meters
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <main className="flex-1 relative">
          <div ref={elementRef} className="w-full h-full" />
          <div className="absolute bottom-4 right-4 space-y-2">
            <button
              onClick={() => {
                mapView?.Camera.animate({ zoom: mapView.Camera.zoom - 2000 });
              }}
              className="flex justify-center items-center w-8 h-8 shrink-0 bg-gray-700 text-white p-2 rounded-full"
            >
              <PlusIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() =>
                mapView?.Camera.animate({ zoom: mapView.Camera.zoom + 2000 })
              }
              className="flex justify-center items-center w-8 h-8 shrink-0 bg-gray-700 text-white p-2 rounded-full"
            >
              <MinusIcon className="w-6 h-6" />
            </button>
          </div>
        </main>
      </div>
    </section>
  );
}

export default Home;
