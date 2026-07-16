import numpy as np

def compute_gradient(X, y, y_hat):
    m = X.shape[0]
    gradient = ((X.T@(y_hat-y))/m)
    return gradient

def update_weights(weights, gradient, alpha):
    new_weights = (weights -(alpha*gradient))
    return new_weights



if __name__ == "__main__":
    X = np.array([
        [0.4, 0.5, 0.3],
        [0.9, 0.8, 0.95],
        [0.2, 0.3, 0.1]
    ])
    y = np.array([1, 0, 1])
    y_hat = np.array([0.9, 0.1, 0.8])

    print(compute_gradient(X, y, y_hat))