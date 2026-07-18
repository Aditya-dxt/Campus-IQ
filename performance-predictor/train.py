from sigmoid import sigmoid
from log_loss import average_log_loss
from gradient_descent import compute_gradient
from update_weight import update_weights
from bias_gradient import compute_bias_gradient
import numpy as np

def train(X, y, weights, b, alpha, epochs):
    for epoch in range(epochs):
        z =  ((X@weights)+b)              # now include bias
        y_hat = sigmoid(z)
        loss = average_log_loss(y, y_hat)
        gradient = compute_gradient(X, y, y_hat)
        bias_gradient = compute_bias_gradient(y,y_hat)    # your formula
        weights = update_weights(weights, gradient, alpha)
        b = (b-(alpha*bias_gradient))            # update b the same way

        if epoch % 100 == 0:
            print(f"Epoch {epoch}, Loss: {loss}")

    return weights, b



if __name__ == "__main__":
    X = np.array([[0.2, 0.5], [0.9, 0.8], [0.1, 0.2], [0.95, 0.9]])
    y = np.array([1, 0, 1, 0])
    weights = np.zeros(X.shape[1])
    b = 0.0
    alpha = 0.1
    epochs = 500

    final_weights, final_b = train(X, y, weights, b, alpha, epochs)
    print(final_weights, final_b)