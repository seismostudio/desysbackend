import numpy as np
import math
from typing import Tuple, Optional, List

def is_point_on_segment(point: Tuple[float, float, float], 
                       start: Tuple[float, float, float], 
                       end: Tuple[float, float, float], 
                       tolerance: float = 1e-4) -> bool:
    """
    Checks if a point lies on a line segment defined by start and end points
    within a specified tolerance.
    """
    p = np.array(point)
    a = np.array(start)
    b = np.array(end)
    
    # Check if point is close to endpoints
    dist_a = np.linalg.norm(p - a)
    dist_b = np.linalg.norm(p - b)
    if dist_a < tolerance or dist_b < tolerance:
        return False  # Existing joint at endpoint is already connected
        
    # Check collinearity
    # Vector AB
    ab = b - a
    len_ab = np.linalg.norm(ab)
    
    if len_ab < tolerance:
        return False # Zero length segment
        
    # Vector AP
    ap = p - a
    
    # Project AP onto AB
    t = np.dot(ap, ab) / (len_ab * len_ab)
    
    # Check parameter t is within [0, 1] (exclusive for internal points)
    if t <= tolerance or t >= (1.0 - tolerance):
        return False
        
    # Check distance from line
    closest_point = a + t * ab
    dist = np.linalg.norm(p - closest_point)
    
    return dist < tolerance

def get_segment_intersection(
    p1: Tuple[float, float, float], p2: Tuple[float, float, float],
    p3: Tuple[float, float, float], p4: Tuple[float, float, float],
    tolerance: float = 1e-4
) -> Optional[Tuple[float, float, float]]:
    """
    Finds the intersection point of two line segments in 3D.
    Returns None if they don't intersect or are parallel/skew beyond tolerance.
    """
    # Using closest point of approach algorithm
    
    P1 = np.array(p1)
    P2 = np.array(p2)
    P3 = np.array(p3)
    P4 = np.array(p4)
    
    d1 = P2 - P1
    d2 = P4 - P3
    
    n1 = np.linalg.norm(d1)
    n2 = np.linalg.norm(d2)
    
    if n1 < tolerance or n2 < tolerance:
        return None
        
    u = np.cross(d1, d2)
    denom = np.linalg.norm(u)
    
    if denom < 1e-4:
        # Parallel lines
        return None
        
    # t1 = ( (p3 - p1) . (d2 x u) ) / |u|^2
    # t2 = ( (p3 - p1) . (d1 x u) ) / |u|^2
    
    v = P3 - P1
    t1 = np.dot(v, np.cross(d2, u)) / (denom * denom)
    t2 = np.dot(v, np.cross(d1, u)) / (denom * denom)
    
    # Check if intersection is within segments (0 < t < 1)
    # We want strictly internal intersections, as endpoints are already nodes
    if (tolerance < t1 < 1.0 - tolerance) and (tolerance < t2 < 1.0 - tolerance):
        # Calculate closest points
        c1 = P1 + t1 * d1
        c2 = P3 + t2 * d2
        
        # Check actual distance between lines
        if np.linalg.norm(c1 - c2) < tolerance:
            return tuple(c1.tolist())
            
    return None
