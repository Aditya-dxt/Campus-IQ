import numpy as np

def compute_gradient(X, y, y_hat):
    m = X.shape[0]
    gradient = ((X.T@(y_hat-y))/m)
    return gradient
