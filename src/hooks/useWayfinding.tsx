import {
  E_SDK_EVENT,
  E_SDK_EVENT_PAYLOAD,
  MappedinLocation,
  MapView,
} from "@mappedin/mappedin-js";
import { useEffect, useState } from "react";
import { useMapClick } from "./useMapClick";

export default function useWayfinding(mapView: MapView | undefined) {
  const [startLocation, setStartLocation] = useState<MappedinLocation | undefined>();
  const [endLocation, setEndLocation] = useState<MappedinLocation | undefined>();
  const [isSettingStart, setIsSettingStart] = useState(true);
  const [pathDrawn, setPathDrawn] = useState(false);

  useMapClick(
    mapView,
    ({ polygons }: E_SDK_EVENT_PAYLOAD[E_SDK_EVENT.CLICK]) => {
      if (pathDrawn) {
        console.log("Path is already drawn. Click disabled.");
        return;
      }

      if (polygons && polygons[0] && polygons[0].locations && polygons[0].locations[0]) {
        const clickedLocation = polygons[0].locations[0];

        if (!clickedLocation.nodes || clickedLocation.nodes.length === 0) {
          console.log("Clicked location has no valid nodes.");
          return;
        }

        if (isSettingStart) {
          setStartLocation(clickedLocation);
          console.log("Start location set:", clickedLocation);
        } else {
          setEndLocation(clickedLocation);
          console.log("End location set:", clickedLocation);
        }
        setIsSettingStart(!isSettingStart);
      } else {
        console.log("No valid location found");
      }
    }
  );

  useEffect(() => {
    if (!mapView) {
      console.log("MapView is not defined");
      return;
    }

    if (!startLocation || !startLocation.nodes || startLocation.nodes.length === 0) {
      console.log("Start location is not defined or has no valid nodes");
      return;
    }

    if (!endLocation || !endLocation.nodes || endLocation.nodes.length === 0) {
      console.log("End location is not defined or has no valid nodes");
      return;
    }

    const directions = startLocation.directionsTo(endLocation, { accessible: false });

    if (!directions || directions.distance === 0) {
      console.log("No valid directions found between locations");
      return;
    }

    mapView.Journey.draw(directions, {
      pathOptions: {
        color: "blue",
      },
    });

    setPathDrawn(true); 

    console.log("Path drawn between start and end locations.");
  }, [startLocation, endLocation, mapView]);

  const clearAll = () => {
    setStartLocation(undefined);
    setEndLocation(undefined);
    setPathDrawn(false);
    mapView?.Journey.clear(); 
    console.log("All locations and path cleared.");
  };

  return {
    startLocation,
    setStartLocation,
    endLocation,
    setEndLocation,
    isSettingStart,
    setIsSettingStart,
    clearAll,
    pathDrawn,
  };
}
